import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { retryOperation } from '@/utils/retryOperation';

/**
 * Hook para processar automaticamente jobs pendentes de retry
 * Verifica periodicamente jobs que estão aguardando retry e os reprocessa
 */
export function useAutoRetryProcessor() {
  const intervalRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef(false);

  useEffect(() => {
    const processRetries = async () => {
      // Evitar múltiplas execuções simultâneas
      if (processingRef.current) return;
      
      processingRef.current = true;
      
      try {
        // Buscar jobs pendentes de retry usando a função SQL
        const { data: pendingRetries, error } = await supabase.rpc('process_pending_retries');
        
        if (error) {
          console.error('❌ Erro ao buscar retries pendentes:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          // NÃO mostrar toast - isso polui a UI a cada 2 minutos
          // Apenas logar silenciosamente para debugging
          return;
        }

        if (!pendingRetries || pendingRetries.length === 0) {
          return;
        }

        console.log(`🔄 Processando ${pendingRetries.length} job(s) pendente(s) de retry...`);

        // Processar cada job com retry usando nossa utility de retry
        for (const job of pendingRetries) {
          try {
            await retryOperation(
              async () => {
                const { data, error: invokeError } = await supabase.functions.invoke(
                  'intelligent-pipeline-orchestrator',
                  {
                    body: {
                      document_id: job.document_id,
                      auto_insert_threshold: 0.8,
                      is_retry: true,
                      retry_attempt: job.retry_attempt
                    }
                  }
                );

                if (invokeError) throw invokeError;
                if (!data?.success) throw new Error(data?.error || 'Processing failed');

                return data;
              },
              {
                maxRetries: 1, // Não fazer retry adicional aqui, o sistema já controla
                initialDelay: 500
              }
            );

            // Mostrar notificação de sucesso no retry
            toast.success(
              `Documento reprocessado com sucesso (tentativa ${job.retry_attempt})`,
              {
                description: 'O processamento foi concluído após retry automático',
                duration: 5000
              }
            );
          } catch (retryError) {
            console.error(`❌ Erro ao reprocessar job ${job.job_id}:`, {
              error: retryError,
              jobId: job.job_id,
              documentId: job.document_id,
              attempt: job.retry_attempt
            });
            
            // Notificar apenas se for a última tentativa
            const { data: jobData } = await supabase
              .from('document_extraction_jobs')
              .select('retry_count, max_retries')
              .eq('id', job.job_id)
              .single();

            if (jobData && jobData.retry_count >= jobData.max_retries) {
              toast.error(
                'Falha permanente no processamento',
                {
                  description: `Documento falhou após ${jobData.max_retries} tentativas`,
                  duration: 8000
                }
              );
            }
          }
        }
      } catch (error) {
        console.error('Erro no processador de retries:', error);
      } finally {
        processingRef.current = false;
      }
    };

    // Processar imediatamente ao montar
    processRetries();

    // Configurar verificação periódica a cada 2 minutos
    intervalRef.current = setInterval(processRetries, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
}
