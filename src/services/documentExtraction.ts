import { supabase } from "@/integrations/supabase/client";

export interface FileRecord {
  id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  status: 'uploaded' | 'parsed' | 'extracted' | 'failed';
  error?: string;
  created_at: string;
}

export interface ExtractionRecord {
  id: string;
  file_id: string;
  model: string;
  quality_score: number;
  raw_json: any;
  created_at: string;
}

export interface ExtractionItem {
  id: string;
  extraction_id: string;
  row_index?: number;
  field_name: string;
  extracted_value?: string;
  source_text?: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

export interface ExtractionStatus {
  status: 'uploaded' | 'parsing' | 'completed' | 'failed' | 'error';
  progress: number;
  message: string;
  file_id?: string;
  extraction_id?: string;
  items_count?: number;
  quality_score?: number;
}

class DocumentExtractionService {
  async uploadFile(file: File): Promise<FileRecord> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Create file record first
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert({
        user_id: session.user.id,
        original_name: file.name,
        storage_path: `${session.user.id}/${crypto.randomUUID()}/${file.name}`,
        mime: file.type,
        size_bytes: file.size,
        status: 'uploaded'
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      throw new Error(`Failed to create file record: ${fileError?.message}`);
    }

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileRecord.storage_path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // Clean up file record if upload fails
      await supabase.from('files').delete().eq('id', fileRecord.id);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    return fileRecord as FileRecord;
  }

  async startExtraction(fileId: string): Promise<{ ok: boolean; extraction_id?: string; error?: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await supabase.functions.invoke('extract', {
      body: { file_id: fileId },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) {
      throw new Error(`Extraction failed: ${response.error.message}`);
    }

    return response.data;
  }

  async getExtractionStatus(fileId: string, extractionId?: string): Promise<ExtractionStatus> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await supabase.functions.invoke('extract-status', {
      body: { file_id: fileId, extraction_id: extractionId },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) {
      throw new Error(`Failed to get status: ${response.error.message}`);
    }

    return response.data;
  }

  async getExtractionItems(extractionId: string): Promise<ExtractionItem[]> {
    const { data, error } = await supabase
      .from('extraction_items_staging')
      .select('*')
      .eq('extraction_id', extractionId)
      .order('row_index', { ascending: true, nullsFirst: false })
      .order('field_name');

    if (error) {
      throw new Error(`Failed to get extraction items: ${error.message}`);
    }

    return (data || []) as ExtractionItem[];
  }

  async updateExtractionItem(itemId: string, updates: Partial<ExtractionItem>): Promise<void> {
    const { error } = await supabase
      .from('extraction_items_staging')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  async approveItems(extractionId: string, itemIds: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    // Get items to approve
    const { data: items, error: itemsError } = await supabase
      .from('extraction_items_staging')
      .select(`
        *,
        extractions!inner(file_id)
      `)
      .in('id', itemIds)
      .eq('extraction_id', extractionId);

    if (itemsError || !items?.length) {
      throw new Error('Items not found or access denied');
    }

    const fileId = items[0].extractions.file_id;

    // Create curated items
    const curatedItems = items.map(item => ({
      file_id: fileId,
      field_name: item.field_name,
      value: item.extracted_value || '',
      approved_by: session.user.id,
      lineage: {
        extraction_id: extractionId,
        original_confidence: item.confidence,
        source_text: item.source_text
      }
    }));

    const { error: curatedError } = await supabase
      .from('extraction_items_curated')
      .insert(curatedItems);

    if (curatedError) {
      throw new Error(`Failed to approve items: ${curatedError.message}`);
    }

    // Update staging items status
    await supabase
      .from('extraction_items_staging')
      .update({ status: 'approved' })
      .in('id', itemIds);

    // Log approval
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'items_approved',
      target_id: extractionId,
      details: {
        item_ids: itemIds,
        items_count: itemIds.length
      }
    });
  }

  async rejectItems(extractionId: string, itemIds: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    await supabase
      .from('extraction_items_staging')
      .update({ status: 'rejected' })
      .in('id', itemIds);

    // Log rejection
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'items_rejected',
      target_id: extractionId,
      details: {
        item_ids: itemIds,
        items_count: itemIds.length
      }
    });
  }

  async getFile(fileId: string): Promise<FileRecord> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      throw new Error(`File not found: ${error.message}`);
    }

    return data as FileRecord;
  }

  async getFileUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('uploads')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || '';
  }
}

export const documentExtractionService = new DocumentExtractionService();