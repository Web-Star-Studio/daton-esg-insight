import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ExtractionJobRow = Database['public']['Tables']['document_extraction_jobs']['Row'];
type ExtractedDataPreviewRow = Database['public']['Tables']['extracted_data_preview']['Row'];
type AIPatternRow = Database['public']['Tables']['ai_extraction_patterns']['Row'];

export interface ExtractionJob extends Omit<ExtractionJobRow, 'status'> {
  status: 'Processando' | 'Concluído' | 'Erro';
}

export interface ExtractedDataPreview extends Omit<ExtractedDataPreviewRow, 'extracted_fields' | 'confidence_scores' | 'suggested_mappings' | 'validation_status'> {
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  suggested_mappings: Record<string, string>;
  validation_status: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface AIPattern extends Omit<AIPatternRow, 'field_patterns' | 'extraction_rules'> {
  field_patterns: Record<string, any>;
  extraction_rules: Record<string, any>;
}

// Processar documento com IA
export const processDocumentWithAI = async (documentId: string): Promise<{ jobId: string; status: string; message: string }> => {
  console.log('Starting AI processing for document:', documentId);

  const { data, error } = await supabase.functions.invoke('document-ai-processor', {
    body: { 
      action: 'process',
      documentId 
    },
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error processing document with AI:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }

  return data;
};

// Obter status do job de processamento
export const getExtractionJobStatus = async (jobId: string): Promise<ExtractionJob & { extracted_data_preview?: ExtractedDataPreview[] }> => {
  console.log('Getting extraction job status:', jobId);

  const { data, error } = await supabase.functions.invoke('document-ai-processor', {
    method: 'GET',
    body: { 
      action: 'status',
      jobId 
    }
  });

  if (error) {
    console.error('Error getting job status:', error);
    throw new Error(`Failed to get job status: ${error.message}`);
  }

  return data;
};

// Aprovar dados extraídos
export const approveExtractedData = async (
  previewId: string, 
  finalData: Record<string, any>
): Promise<{ success: boolean; message: string }> => {
  console.log('Approving extracted data:', previewId);

  const { data, error } = await supabase.functions.invoke('document-ai-processor', {
    body: { 
      action: 'approve',
      previewId, 
      finalData 
    },
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error approving data:', error);
    throw new Error(`Failed to approve data: ${error.message}`);
  }

  return data;
};

// Rejeitar dados extraídos
export const rejectExtractedData = async (
  previewId: string, 
  rejectionNotes: string
): Promise<{ success: boolean; message: string }> => {
  console.log('Rejecting extracted data:', previewId);

  const { data, error } = await supabase.functions.invoke('document-ai-processor', {
    body: { 
      action: 'reject',
      previewId, 
      rejectionNotes 
    },
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error rejecting data:', error);
    throw new Error(`Failed to reject data: ${error.message}`);
  }

  return data;
};

// Listar jobs de extração da empresa
export const getExtractionJobs = async (): Promise<ExtractionJob[]> => {
  console.log('Fetching extraction jobs...');

  const { data, error } = await supabase
    .from('document_extraction_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching extraction jobs:', error);
    throw new Error(`Failed to fetch extraction jobs: ${error.message}`);
  }

  return (data || []) as ExtractionJob[];
};

// Listar dados aguardando aprovação
export const getPendingExtractions = async (): Promise<ExtractedDataPreview[]> => {
  console.log('Fetching pending extractions...');

  const { data, error } = await supabase
    .from('extracted_data_preview')
    .select(`
      *,
      document_extraction_jobs!inner(
        document_id,
        documents(file_name, file_type)
      )
    `)
    .eq('validation_status', 'Pendente')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending extractions:', error);
    throw new Error(`Failed to fetch pending extractions: ${error.message}`);
  }

  return (data || []) as ExtractedDataPreview[];
};

// Estatísticas de processamento IA
export const getAIProcessingStats = async (): Promise<{
  totalProcessed: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
}> => {
  console.log('Fetching AI processing statistics...');

  try {
    // Total processado
    const { count: totalProcessed } = await supabase
      .from('document_extraction_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Concluído');

    // Pendente aprovação
    const { count: pendingApproval } = await supabase
      .from('extracted_data_preview')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'Pendente');

    // Aprovado
    const { count: approved } = await supabase
      .from('extracted_data_preview')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'Aprovado');

    // Rejeitado
    const { count: rejected } = await supabase
      .from('extracted_data_preview')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'Rejeitado');

    // Confiança média
    const { data: confidenceData } = await supabase
      .from('document_extraction_jobs')
      .select('confidence_score')
      .not('confidence_score', 'is', null);

    let averageConfidence = 0;
    if (confidenceData && confidenceData.length > 0) {
      const total = confidenceData.reduce((sum, item) => sum + (item.confidence_score || 0), 0);
      averageConfidence = total / confidenceData.length;
    }

    return {
      totalProcessed: totalProcessed || 0,
      pendingApproval: pendingApproval || 0,
      approved: approved || 0,
      rejected: rejected || 0,
      averageConfidence: Math.round(averageConfidence * 100) / 100
    };

  } catch (error) {
    console.error('Error fetching AI stats:', error);
    return {
      totalProcessed: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
      averageConfidence: 0
    };
  }
};

// Obter padrões de IA aprendidos
export const getAIPatterns = async (): Promise<AIPattern[]> => {
  console.log('Fetching AI patterns...');

  const { data, error } = await supabase
    .from('ai_extraction_patterns')
    .select('*')
    .order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching AI patterns:', error);
    throw new Error(`Failed to fetch AI patterns: ${error.message}`);
  }

  return (data || []) as AIPattern[];
};

// Utility functions
export const getDocumentTypeLabel = (type: string): string => {
  const types = {
    'energy_invoice': 'Fatura de Energia',
    'waste_document': 'Documento de Resíduos',
    'fuel_invoice': 'Nota Fiscal de Combustível',
    'license_document': 'Documento de Licença',
    'general_document': 'Documento Geral'
  };
  return types[type] || type;
};

export const getProcessingTypeLabel = (type: string): string => {
  const types = {
    'ocr_pdf': 'OCR de PDF',
    'excel_parse': 'Análise de Excel',
    'csv_parse': 'Análise de CSV',
    'unknown': 'Desconhecido'
  };
  return types[type] || type;
};

export const getConfidenceBadgeVariant = (confidence: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (confidence >= 0.8) return 'default';
  if (confidence >= 0.6) return 'secondary';
  if (confidence >= 0.4) return 'outline';
  return 'destructive';
};

export const formatConfidenceScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};