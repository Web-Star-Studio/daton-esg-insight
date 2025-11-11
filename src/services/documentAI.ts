import { supabase } from '@/integrations/supabase/client';

export interface ProcessingResult {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

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
