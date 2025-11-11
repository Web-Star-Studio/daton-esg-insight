import { supabase } from "@/integrations/supabase/client";
import Papa from 'papaparse';

// Interfaces
export interface DocumentFolder {
  id: string;
  company_id: string;
  name: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
  children?: DocumentFolder[];
}

export interface Document {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  folder_id?: string;
  tags?: string[];
  related_model: string;
  related_id: string;
  uploader_user_id: string;
  upload_date: string;
  document_folders?: {
    name: string;
  };
  ai_processing_status?: string;
  ai_confidence_score?: number;
  ai_extracted_category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentFilters {
  search?: string;
  folder_id?: string;
  tag?: string;
}

export interface CreateFolderData {
  name: string;
  parent_folder_id?: string;
}

export interface UpdateDocumentData {
  folder_id?: string;
  tags?: string[];
}

// Folder management
export const getFolders = async (): Promise<DocumentFolder[]> => {
  console.log('Fetching folder hierarchy...');
  
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching folders:', error);
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  // Build hierarchy
  return buildFolderHierarchy(data || []);
};

// Helper function to build folder hierarchy
const buildFolderHierarchy = (folders: DocumentFolder[]): DocumentFolder[] => {
  const folderMap = new Map<string, DocumentFolder>();
  const rootFolders: DocumentFolder[] = [];

  // First, create a map of all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Then, build the hierarchy
  folders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id)!;
    
    if (folder.parent_folder_id) {
      const parent = folderMap.get(folder.parent_folder_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(folderWithChildren);
      }
    } else {
      rootFolders.push(folderWithChildren);
    }
  });

  return rootFolders;
};

export const createFolder = async (folderData: CreateFolderData): Promise<DocumentFolder> => {
  console.log('Creating folder:', folderData);

  // Get user company
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  }
  
  if (!profile) {
    throw new Error('User profile not found');
  }

  const { data, error } = await supabase
    .from('document_folders')
    .insert({
      ...folderData,
      company_id: profile.company_id
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating folder:', error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Não foi possível criar a pasta');
  }

  return data;
};

// Document management with pagination
export const getDocuments = async (
  filters?: DocumentFilters & { 
    page?: number; 
    limit?: number; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }
): Promise<{
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  console.log('Fetching documents with filters:', filters);

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('documents')
    .select(`
      *,
      document_folders (
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.search) {
    query = query.ilike('file_name', `%${filters.search}%`);
  }

  if (filters?.folder_id) {
    query = query.eq('folder_id', filters.folder_id);
  }

  if (filters?.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'upload_date';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    documents: data || [],
    total: count || 0,
    page,
    totalPages
  };
};

// Utility function to normalize file paths (removes ALL leading 'documents/' prefixes)
export const normalizePath = (path: string): string => {
  // Remove all leading 'documents/' prefixes (handles legacy duplicates)
  return path.replace(/^(documents\/)+/, '');
};

export const uploadDocument = async (
  file: File,
  options?: {
    folder_id?: string;
    tags?: string[];
    related_model?: string;
    related_id?: string;
    onProgress?: (progress: number) => void;
    skipAutoProcessing?: boolean;
  }
): Promise<Document> => {
  console.log('📤 Uploading document:', file.name, options);

  // Validação de arquivo
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Máximo: 20MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: PDF, Excel, CSV, Imagens, Word`);
  }

  // Get user info
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile error:', profileError);
    throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  }
  
  if (!profile?.company_id) {
    throw new Error('User profile or company not found');
  }

  // Check if auto AI processing is enabled
  const { data: company } = await supabase
    .from('companies')
    .select('auto_ai_processing')
    .eq('id', profile.company_id)
    .maybeSingle();

  const shouldAutoProcess = company?.auto_ai_processing && !options?.skipAutoProcessing;

  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileExt = sanitizedName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileName = `${timestamp}-${randomId}.${fileExt}`;
  // Store without 'documents/' prefix - bucket name is enough
  const filePath = fileName;

  console.log('📁 Storage path:', filePath);

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    console.error('❌ Storage upload error:', uploadError);
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  console.log('✅ File uploaded to storage:', uploadData.path);

  // Simulate progress callback
  if (options?.onProgress) {
    options.onProgress(100);
  }

  // Create document record in database
  const documentData = {
    company_id: profile.company_id,
    uploader_user_id: user.id,
    file_name: file.name, // Original filename
    file_path: uploadData.path, // Storage path
    file_type: file.type,
    file_size: file.size,
    folder_id: options?.folder_id || null,
    tags: options?.tags || null,
    related_model: options?.related_model || 'document',
    related_id: options?.related_id || crypto.randomUUID(),
  };

  console.log('💾 Creating document record:', documentData);

  const { data, error } = await supabase
    .from('documents')
    .insert(documentData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Database insert error:', error);
    // Clean up uploaded file if record creation fails
    console.log('🧹 Cleaning up storage file...');
    await supabase.storage.from('documents').remove([uploadData.path]);
    throw new Error(`Falha ao criar registro: ${error.message}`);
  }
  
  if (!data) {
    console.error('❌ No data returned from insert');
    await supabase.storage.from('documents').remove([uploadData.path]);
    throw new Error('Não foi possível criar o registro do documento');
  }

  console.log('✅ Document uploaded successfully:', data.id);

  // Trigger automatic AI processing if enabled
  if (shouldAutoProcess) {
    console.log('🤖 Auto-processing enabled, triggering AI analysis...');
    // Import dynamically to avoid circular dependencies
    import('./documentAI').then(({ processDocumentWithAI }) => {
      processDocumentWithAI(data.id).catch((err) => {
        console.error('❌ Auto AI processing failed:', err);
        // Don't throw error - upload was successful, just processing failed
      });
    });
  }

  return data;
};

export const updateDocument = async (
  documentId: string,
  updates: UpdateDocumentData
): Promise<Document> => {
  console.log('Updating document:', documentId, updates);

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Documento não encontrado');
  }

  return data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  console.log('Deleting document:', documentId);

  // Get document info to delete from storage
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }
  
  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path]);

  if (storageError) {
    console.warn('Error deleting file from storage:', storageError);
  }

  // Delete document record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

export const downloadDocument = async (documentId: string): Promise<{ url: string; fileName: string }> => {
  console.log('Getting download URL for document:', documentId);

  // Get document info
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_name, file_type')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }
  
  if (!document) {
    throw new Error('Documento não encontrado');
  }

  const normalizedPath = normalizePath(document.file_path);

  // Try multiple fallback methods
  // Method 1: Signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from('documents')
    .createSignedUrl(normalizedPath, 60);

  if (!signedError && signedData?.signedUrl) {
    return {
      url: signedData.signedUrl,
      fileName: document.file_name
    };
  }

  console.warn('Signed URL failed, trying direct download...', signedError);

  // Method 2: Direct download and create blob URL
  const { data: blob, error: downloadError } = await supabase.storage
    .from('documents')
    .download(normalizedPath);

  if (!downloadError && blob) {
    const url = URL.createObjectURL(blob);
    return {
      url,
      fileName: document.file_name
    };
  }

  console.error('All download methods failed:', { signedError, downloadError });
  throw new Error(`Falha ao criar URL de download: ${downloadError?.message || signedError?.message}`);
};

// Get document preview (for modal display)
export const getDocumentPreview = async (documentId: string): Promise<{ url: string; type: string }> => {
  console.log('Getting preview URL for document:', documentId);

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_type')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError || !document) {
    throw new Error('Documento não encontrado');
  }

  const normalizedPath = normalizePath(document.file_path);

  // Method 1: Try signed URL first
  const { data: signedData, error: signedError } = await supabase.storage
    .from('documents')
    .createSignedUrl(normalizedPath, 300); // 5 minutes for preview

  if (!signedError && signedData?.signedUrl) {
    return {
      url: signedData.signedUrl,
      type: document.file_type
    };
  }

  console.warn('Signed URL failed for preview, trying download...', signedError);

  // Method 2: Download and create blob URL
  const { data: blob, error: downloadError } = await supabase.storage
    .from('documents')
    .download(normalizedPath);

  if (!downloadError && blob) {
    const url = URL.createObjectURL(blob);
    return {
      url,
      type: document.file_type
    };
  }

  throw new Error(`Falha ao criar preview: ${downloadError?.message || signedError?.message}`);
};

// Get text content for CSV/text preview
export const getDocumentTextPreview = async (documentId: string): Promise<{
  content: string;
  headers?: string[];
  rows?: any[];
  totalLines: number;
}> => {
  console.log('📖 Getting text preview for document:', documentId);

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_type')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError || !document) {
    console.error('❌ Document not found:', fetchError);
    throw new Error('Documento não encontrado');
  }

  const normalizedPath = normalizePath(document.file_path);
  console.log('📁 Normalized path:', normalizedPath);

  let text: string;

  // Method 1: Try signed URL + fetch (more reliable with bucket policies)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('documents')
    .createSignedUrl(normalizedPath, 300);

  if (!signedError && signedData?.signedUrl) {
    console.log('✅ Using signed URL for text preview');
    try {
      const response = await fetch(signedData.signedUrl);
      if (response.ok) {
        text = await response.text();
      } else {
        throw new Error(`Fetch failed: ${response.status}`);
      }
    } catch (fetchErr) {
      console.warn('⚠️ Signed URL fetch failed, trying direct download...', fetchErr);
      // Fall through to Method 2
    }
  }

  // Method 2: Direct download (fallback)
  if (!text) {
    console.log('🔄 Falling back to direct download');
    const { data: blob, error: downloadError } = await supabase.storage
      .from('documents')
      .download(normalizedPath);

    if (downloadError || !blob) {
      console.error('❌ Both methods failed:', { signedError, downloadError });
      throw new Error(
        `Falha ao baixar arquivo para preview:\n` +
        `- Signed URL: ${signedError?.message || 'OK'}\n` +
        `- Download: ${downloadError?.message || 'OK'}`
      );
    }

    text = await blob.text();
  }

  const lines = text.split('\n');
  const totalLines = lines.length;

  // For CSV, parse with PapaParse (robust parsing)
  if (document.file_type.includes('csv')) {
    console.log('📊 Parsing CSV with PapaParse...');
    
    const parseResult = Papa.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: 'greedy',
      preview: 100 // Only parse first 100 rows
    });

    const headers = parseResult.meta.fields || [];
    const rows = parseResult.data as Record<string, any>[];

    console.log(`✅ CSV parsed: ${headers.length} columns, ${rows.length} rows preview`);

    return {
      content: lines.slice(0, 200).join('\n'), // First 200 lines as text fallback
      headers,
      rows,
      totalLines
    };
  }

  // For plain text, return first 200 lines
  console.log('📝 Plain text preview:', totalLines, 'total lines');
  return {
    content: lines.slice(0, 200).join('\n'),
    totalLines
  };
};

// Bulk operations
export const bulkDeleteDocuments = async (documentIds: string[]): Promise<void> => {
  console.log('Bulk deleting documents:', documentIds);

  // Get all documents to delete files from storage
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .in('id', documentIds);

  if (fetchError) {
    console.error('Error fetching documents:', fetchError);
    throw new Error(`Failed to fetch documents: ${fetchError.message}`);
  }

  // Delete files from storage
  const filePaths = documents.map(doc => doc.file_path);
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove(filePaths);

  if (storageError) {
    console.warn('Error deleting files from storage:', storageError);
  }

  // Delete document records
  const { error } = await supabase
    .from('documents')
    .delete()
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk deleting documents:', error);
    throw new Error(`Failed to bulk delete documents: ${error.message}`);
  }
};

export const bulkMoveDocuments = async (documentIds: string[], targetFolderId: string | null): Promise<void> => {
  console.log('Bulk moving documents:', documentIds, 'to folder:', targetFolderId);

  const { error } = await supabase
    .from('documents')
    .update({ folder_id: targetFolderId })
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk moving documents:', error);
    throw new Error(`Failed to bulk move documents: ${error.message}`);
  }
};

export const bulkUpdateTags = async (documentIds: string[], tags: string[]): Promise<void> => {
  console.log('Bulk updating tags for documents:', documentIds, 'tags:', tags);

  const { error } = await supabase
    .from('documents')
    .update({ tags })
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk updating tags:', error);
    throw new Error(`Failed to bulk update tags: ${error.message}`);
  }
};


// Utility functions
export const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎥';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('text') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📈';
  return '📎';
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};