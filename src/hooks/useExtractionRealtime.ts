import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Check authentication status before subscribing
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Only subscribe if enabled AND authenticated
    if (!enabled || !isAuthenticated) {
      if (!isAuthenticated) {
        logger.debug('Extraction realtime: Skipping subscription - user not authenticated', 'api');
      }
      return;
    }

    logger.info('Setting up extraction realtime subscriptions...', 'api');

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
          logger.debug('New approval log received', 'api', { payload: payload.new });
          
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Approval channel connected successfully', 'api');
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('Approval channel connection error', 'api');
          setConnectionStatus('error');
        }
      });

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
          logger.debug('New preview created', 'api', { payload: payload.new });
          
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
          logger.debug('Preview updated', 'api', { payload: payload.new });
          
          // Call custom handler
          if (onPreviewUpdate) {
            onPreviewUpdate(payload.new);
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['extracted-data-previews'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Preview channel connected successfully', 'api');
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('Preview channel connection error', 'api');
        }
      });

    // Cleanup
    return () => {
      logger.debug('Unsubscribing from extraction realtime channels', 'api');
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(previewChannel);
    };
  }, [enabled, queryClient, onApprovalLog, onPreviewUpdate, isAuthenticated]);

  return { connectionStatus, isAuthenticated };
}
