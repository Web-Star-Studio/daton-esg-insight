import { supabase } from "@/integrations/supabase/client";

export interface MTRDocument {
  id: string;
  waste_log_id: string;
  file_path: string;
  file_name: string;
  extracted_data: any;
  validation_status: string;
  confidence_score: number;
  upload_date: string;
  validated_by_user_id?: string;
  validation_date?: string;
  created_at: string;
}

export interface ExtractedMTRData {
  mtr_number?: string;
  issue_date?: string;
  waste_description?: string;
  waste_class?: string;
  quantity?: number;
  unit?: string;
  transporter_name?: string;
  transporter_cnpj?: string;
  destination_name?: string;
  destination_cnpj?: string;
  transport_date?: string;
  [key: string]: any;
}

export interface MTRProcessingResult {
  success: boolean;
  document?: MTRDocument;
  error?: string;
  extracted_data?: ExtractedMTRData;
}

// Get MTR documents for a waste log
export const getMTRDocumentsByWasteLogId = async (wasteLogId: string): Promise<MTRDocument[]> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .select('*')
    .eq('waste_log_id', wasteLogId)
    .order('upload_date', { ascending: false });

  if (error) throw new Error(`Erro ao buscar documentos MTR: ${error.message}`);
  return data || [];
};

// Get MTR document by ID
export const getMTRDocumentById = async (id: string): Promise<MTRDocument> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Erro ao buscar documento MTR: ${error.message}`);
  return data;
};

// Upload MTR document file
export const uploadMTRFile = async (file: File, wasteLogId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `mtr_${wasteLogId}_${Date.now()}.${fileExt}`;
  const filePath = `mtr-documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
  }

  return filePath;
};

// Create MTR document record
export const createMTRDocument = async (
  wasteLogId: string,
  filePath: string,
  fileName: string,
  extractedData?: ExtractedMTRData
): Promise<MTRDocument> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .insert({
      waste_log_id: wasteLogId,
      file_path: filePath,
      file_name: fileName,
      extracted_data: extractedData || {},
      validation_status: 'Pendente',
      confidence_score: 0
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar documento MTR: ${error.message}`);
  return data;
};

// Process MTR document with OCR
export const processMTRDocument = async (documentId: string): Promise<MTRProcessingResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('document-ai-processor', {
      body: {
        document_id: documentId,
        processing_type: 'mtr_extraction'
      }
    });

    if (error) {
      return {
        success: false,
        error: `Erro no processamento: ${error.message}`
      };
    }

    return {
      success: true,
      extracted_data: data.extracted_data,
      document: data.document
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro na comunicação com o serviço de processamento: ${error}`
    };
  }
};

// Update MTR document extracted data
export const updateMTRDocumentData = async (
  id: string,
  extractedData: ExtractedMTRData,
  confidenceScore: number
): Promise<MTRDocument> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .update({
      extracted_data: extractedData,
      confidence_score: confidenceScore,
      validation_status: confidenceScore > 0.7 ? 'Validado' : 'Pendente'
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar documento MTR: ${error.message}`);
  return data;
};

// Validate MTR document
export const validateMTRDocument = async (
  id: string,
  status: 'Validado' | 'Rejeitado',
  userId: string
): Promise<MTRDocument> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .update({
      validation_status: status,
      validated_by_user_id: userId,
      validation_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao validar documento MTR: ${error.message}`);
  return data;
};

// Get MTR documents that need validation
export const getPendingMTRDocuments = async (): Promise<MTRDocument[]> => {
  const { data, error } = await supabase
    .from('mtr_documents')
    .select(`
      *,
      waste_logs!inner(
        id,
        mtr_number,
        waste_description,
        company_id
      )
    `)
    .eq('validation_status', 'Pendente')
    .eq('waste_logs.company_id', await getCurrentCompanyId())
    .order('upload_date', { ascending: true });

  if (error) throw new Error(`Erro ao buscar documentos pendentes: ${error.message}`);
  return data || [];
};

// Helper function to get current company ID
const getCurrentCompanyId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
};

// Get MTR statistics
export const getMTRStats = async () => {
  const companyId = await getCurrentCompanyId();

  const { data, error } = await supabase
    .from('mtr_documents')
    .select(`
      validation_status,
      confidence_score,
      waste_logs!inner(company_id)
    `)
    .eq('waste_logs.company_id', companyId);

  if (error) throw new Error(`Erro ao buscar estatísticas MTR: ${error.message}`);

  const documents = data || [];
  
  return {
    total: documents.length,
    validated: documents.filter(d => d.validation_status === 'Validado').length,
    pending: documents.filter(d => d.validation_status === 'Pendente').length,
    rejected: documents.filter(d => d.validation_status === 'Rejeitado').length,
    high_confidence: documents.filter(d => d.confidence_score > 0.8).length,
    low_confidence: documents.filter(d => d.confidence_score < 0.5).length
  };
};

// Download MTR document
export const downloadMTRDocument = async (filePath: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error) throw new Error(`Erro ao baixar documento: ${error.message}`);
  return data;
};

// Delete MTR document
export const deleteMTRDocument = async (id: string): Promise<void> => {
  // First get the document to delete the file
  const document = await getMTRDocumentById(id);
  
  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path]);

  if (storageError) {
    console.warn(`Erro ao deletar arquivo do storage: ${storageError.message}`);
  }

  // Delete the database record
  const { error } = await supabase
    .from('mtr_documents')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar documento MTR: ${error.message}`);
};