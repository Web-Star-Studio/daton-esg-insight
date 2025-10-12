import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ExtractionRealtimeConfig {
  enabled?: boolean;
  onApprovalLog?: (log: any) => void;
  onItemUpdate?: (item: any) => void;
}

export function useExtractionRealtime({
  enabled = true,
  onApprovalLog,
  onItemUpdate,
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

    // Subscribe to extraction items updates
    const itemsChannel = supabase
      .channel('extraction-items-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'extraction_items_staging',
        },
        (payload) => {
          console.log('Item updated:', payload.new);
          
          // Call custom handler
          if (onItemUpdate) {
            onItemUpdate(payload.new);
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['extraction-items'] });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [enabled, queryClient, onApprovalLog, onItemUpdate]);
}
