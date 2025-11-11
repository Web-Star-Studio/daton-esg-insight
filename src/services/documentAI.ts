import { supabase } from '@/integrations/supabase/client';

// Types
export interface ProcessingResult {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

export interface ExtractionJob {
  id: string;
  company_id: string;
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'Concluído' | 'Erro';
  processing_type?: string;
  confidence_score?: number;
  result_data?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  document?: {
    id: string;
    file_name: string;
    file_type: string;
  };
}

export interface ExtractedDataPreview {
  id: string;
  company_id: string;
  job_id?: string;
  extraction_job_id?: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  target_table: string;
  validation_status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  suggested_mappings?: Record<string, any>;
  created_at: string;
  extraction_job: {
    document: {
      file_name: string;
      file_type: string;
    };
  };
}

export interface AIProcessingStats {
  totalProcessed: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  averageConfidence: number;
}

// Main processing function
export async function processDocumentWithAI(
  documentId: string,
  options?: { autoInsertThreshold?: number }
): Promise<ProcessingResult> {
  try {
    const { data, error } = await supabase.functions.invoke('intelligent-pipeline-orchestrator', {
      body: {
        document_id: documentId,
        auto_insert_threshold: options?.autoInsertThreshold || 0.8
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Processing failed' };
    }

    return {
      success: true,
      jobId: documentId,
      message: data.final_status === 'auto_inserted' 
        ? `Dados inseridos automaticamente (${data.summary.records_inserted} registro(s))`
        : 'Dados enviados para revisão manual'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get extraction jobs
export async function getExtractionJobs(): Promise<ExtractionJob[]> {
  try {
    const { data, error } = await supabase
      .from('document_extraction_jobs')
      .select(`
        *,
        document:documents(id, file_name, file_type)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as ExtractionJob[];
  } catch (error) {
    console.error('Error fetching extraction jobs:', error);
    return [];
  }
}

// Get pending extractions
export async function getPendingExtractions(): Promise<ExtractedDataPreview[]> {
  try {
    const { data, error } = await supabase
      .from('extracted_data_preview')
      .select(`
        *,
        extraction_job:document_extraction_jobs(
          document:documents(file_name, file_type)
        )
      `)
      .eq('validation_status', 'Pendente')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ExtractedDataPreview[];
  } catch (error) {
    console.error('Error fetching pending extractions:', error);
    return [];
  }
}

// Get AI processing stats
export async function getAIProcessingStats(): Promise<AIProcessingStats> {
  try {
    const { data: previews, error } = await supabase
      .from('extracted_data_preview')
      .select('validation_status, confidence_scores');

    if (error) throw error;

    const stats = {
      totalProcessed: previews?.length || 0,
      pendingApproval: previews?.filter(p => p.validation_status === 'Pendente').length || 0,
      approved: previews?.filter(p => p.validation_status === 'Aprovado').length || 0,
      rejected: previews?.filter(p => p.validation_status === 'Rejeitado').length || 0,
      averageConfidence: 0
    };

    // Calculate average confidence
    const allConfidences: number[] = [];
    previews?.forEach(p => {
      const scores = p.confidence_scores as Record<string, number>;
      if (scores) {
        allConfidences.push(...Object.values(scores));
      }
    });

    if (allConfidences.length > 0) {
      stats.averageConfidence = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching AI processing stats:', error);
    return {
      totalProcessed: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
      averageConfidence: 0
    };
  }
}

// Approve extracted data
export async function approveExtractedData(
  previewId: string,
  editedData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('extracted_data_preview')
      .update({ 
        validation_status: 'Aprovado',
        extracted_fields: editedData || undefined
      })
      .eq('id', previewId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error approving extracted data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Reject extracted data
export async function rejectExtractedData(
  previewId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('extracted_data_preview')
      .update({ validation_status: 'Rejeitado' })
      .eq('id', previewId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error rejecting extracted data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get extraction job status
export async function getExtractionJobStatus(jobId: string): Promise<ExtractionJob | null> {
  try {
    const { data, error } = await supabase
      .from('document_extraction_jobs')
      .select(`
        *,
        document:documents(id, file_name, file_type)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data as ExtractionJob;
  } catch (error) {
    console.error('Error fetching extraction job status:', error);
    return null;
  }
}

// Utility functions
export function formatConfidenceScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

export function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' {
  if (confidence >= 0.8) return 'default';
  if (confidence >= 0.6) return 'secondary';
  return 'destructive';
}

export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'invoice': 'Nota Fiscal',
    'report': 'Relatório',
    'spreadsheet': 'Planilha',
    'certificate': 'Certificado',
    'license': 'Licença',
    'emission_report': 'Relatório de Emissões',
    'waste_report': 'Relatório de Resíduos',
    'energy_bill': 'Conta de Energia',
    'water_bill': 'Conta de Água'
  };
  
  return labels[type] || type;
}
