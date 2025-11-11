import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ExtractionRealtimeConfig {
  enabled?: boolean;
  onApprovalLog?: (log: any) => void;
  onPreviewUpdate?: (preview: any) => void;
}

export function useExtractionRealtime({
  enabled = true,
  onApprovalLog,
  onPreviewUpdate,
}: ExtractionRealtimeConfig = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to approval logs
    const approvalChannel = supabase
      .channel('extraction-approval-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'extraction_approval_log',
        },
        (payload) => {
          console.log('New approval log:', payload.new);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
          
          // Call custom handler
          if (onApprovalLog) {
            onApprovalLog(payload.new);
          }

          // Show toast notification
          const action = payload.new.action;
          const itemsCount = payload.new.items_count;
          
          let message = '';
          if (action === 'batch_approved') {
            message = `${itemsCount} itens aprovados em lote com sucesso!`;
          } else if (action === 'approved') {
            message = `${itemsCount} itens aprovados!`;
          } else if (action === 'rejected') {
            message = `${itemsCount} itens rejeitados.`;
          } else if (action === 'edited') {
            message = `${itemsCount} itens editados e salvos.`;
          }

          if (message) {
            toast({
              title: 'Extração atualizada',
              description: message,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to extracted_data_preview updates AND inserts
    const previewChannel = supabase
      .channel('extraction-preview-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'extracted_data_preview',
        },
        (payload) => {
          console.log('New preview created:', payload.new);
          
          // Show notification for new extractions ready for review
          toast({
            title: '✨ Extração concluída!',
            description: 'Dados prontos para revisão na seção de Aprovações. Clique para ver.',
          });

          // Call custom handler
          if (onPreviewUpdate) {
            onPreviewUpdate(payload.new);
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'extracted_data_preview',
        },
        (payload) => {
          console.log('Preview updated:', payload.new);
          
          // Call custom handler
          if (onPreviewUpdate) {
            onPreviewUpdate(payload.new);
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(previewChannel);
    };
  }, [enabled, queryClient, onApprovalLog, onPreviewUpdate]);
}
