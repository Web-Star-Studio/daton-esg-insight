import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ProcessingNotification {
  jobId: string;
  documentName: string;
  status: string;
  confidence: number | null;
  extractedFields: number;
  processingTime: number | null;
}

export function useDocumentProcessingNotifications() {
  const queryClient = useQueryClient();
  const processedJobs = useRef(new Set<string>());

  useEffect(() => {
    console.log('🔔 Setting up document processing notifications...');

    // Subscribe to extraction jobs updates
    const jobsChannel = supabase
      .channel('document-processing-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_extraction_jobs',
          filter: 'status=in.(Concluído,Erro)'
        },
        async (payload) => {
          console.log('📊 Job update received:', payload);
          
          const job = payload.new as any;
          
          // Evitar notificações duplicadas
          if (processedJobs.current.has(job.id)) {
            console.log('⏭️ Skipping duplicate notification for job:', job.id);
            return;
          }
          
          processedJobs.current.add(job.id);
          
          // Buscar nome do documento
          const { data: document } = await supabase
            .from('documents')
            .select('file_name')
            .eq('id', job.document_id)
            .maybeSingle();

          const documentName = document?.file_name || 'Documento';
          
          // Calcular tempo de processamento
          const processingTime = job.processing_end_time && job.processing_start_time
            ? Math.round((new Date(job.processing_end_time).getTime() - 
                         new Date(job.processing_start_time).getTime()) / 1000)
            : null;

          if (job.status === 'Concluído') {
            // Buscar dados da extração
            const { data: preview, count } = await supabase
              .from('extracted_data_preview')
              .select('id, confidence_scores', { count: 'exact' })
              .eq('extraction_job_id', job.id)
              .maybeSingle();

            const avgConfidence = preview?.confidence_scores 
              ? Object.values(preview.confidence_scores as Record<string, number>)
                  .reduce((a, b) => a + b, 0) / Object.values(preview.confidence_scores).length
              : job.confidence_score || 0;

            const fieldsCount = preview?.confidence_scores 
              ? Object.keys(preview.confidence_scores).length 
              : 0;

            const description = [
              `📄 ${documentName}`,
              fieldsCount > 0 ? `✓ ${fieldsCount} campos extraídos` : null,
              `📊 Confiança média: ${Math.round(avgConfidence * 100)}%`,
              processingTime ? `⏱️ Tempo: ${processingTime}s` : null
            ].filter(Boolean).join('\n');

            toast.success('Processamento IA Concluído', {
              description,
              duration: 8000,
              action: preview?.id ? {
                label: 'Revisar',
                onClick: () => {
                  window.location.href = `/intelligence?preview=${preview.id}`;
                }
              } : undefined
            });

            // Invalidar queries relevantes
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['extraction-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['pending-extractions'] });
            queryClient.invalidateQueries({ queryKey: ['ai-processing-stats'] });

          } else if (job.status === 'Erro') {
            const errorDescription = [
              `📄 ${documentName}`,
              job.error_message || 'Erro desconhecido ao processar documento',
              processingTime ? `Tempo: ${processingTime}s` : null
            ].filter(Boolean).join('\n');

            toast.error('Falha no Processamento IA', {
              description: errorDescription,
              duration: 10000
            });

            // Invalidar queries de documentos
            queryClient.invalidateQueries({ queryKey: ['documents'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Jobs channel status:', status);
      });

    // Subscribe to extracted data preview insertions (novos dados para revisar)
    const previewChannel = supabase
      .channel('extraction-preview-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'extracted_data_preview',
          filter: 'validation_status=eq.Pendente'
        },
        async (payload) => {
          console.log('📋 New preview data available:', payload);
          
          const preview = payload.new as any;
          
          // Buscar informações do documento
          const { data: job } = await supabase
            .from('document_extraction_jobs')
            .select('document:documents(file_name)')
            .eq('id', preview.extraction_job_id)
            .maybeSingle();

          const documentName = (job as any)?.document?.file_name || 'Documento';
          
          const fieldsCount = preview.confidence_scores 
            ? Object.keys(preview.confidence_scores).length 
            : 0;

          const previewDescription = [
            `📄 ${documentName}`,
            `✓ ${fieldsCount} campos extraídos aguardando aprovação`,
            `🎯 Tabela destino: ${preview.target_table}`
          ].join('\n');

          toast.info('Dados Prontos para Revisão', {
            description: previewDescription,
            duration: 8000,
            action: {
              label: 'Revisar Agora',
              onClick: () => {
                window.location.href = `/intelligence?preview=${preview.id}`;
              }
            }
          });

          // Invalidar queries de pending extractions
          queryClient.invalidateQueries({ queryKey: ['pending-extractions'] });
          queryClient.invalidateQueries({ queryKey: ['ai-processing-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Preview channel status:', status);
      });

    // Cleanup
    return () => {
      console.log('🔕 Unsubscribing from processing notifications');
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(previewChannel);
      processedJobs.current.clear();
    };
  }, [queryClient]);

  return null;
}
