import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoRefreshConfig {
  queryKeys: string[][];
  interval?: number;
  enableRealtime?: boolean;
  realtimeTable?: string;
  onDataChange?: (payload: any) => void;
}

export const useAutoRefresh = ({
  queryKeys,
  interval = 30000, // 30 seconds default
  enableRealtime = false,
  realtimeTable,
  onDataChange
}: AutoRefreshConfig) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();

  // Manual refresh function
  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map(queryKey => 
          queryClient.invalidateQueries({ queryKey })
        )
      );
      setLastRefresh(new Date());
      toast.success('Dados atualizados com sucesso', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto refresh with polling
  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        queryKeys.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
        setLastRefresh(new Date());
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [queryKeys, interval, queryClient]);

  // Real-time updates with Supabase
  useEffect(() => {
    if (enableRealtime && realtimeTable) {
      channelRef.current = supabase
        .channel('auto-refresh-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: realtimeTable
          },
          (payload) => {
            // Invalidate related queries
            queryKeys.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey });
            });
            
            setLastRefresh(new Date());
            
            if (onDataChange) {
              onDataChange(payload);
            }

            // Show notification for important changes
            if (['INSERT', 'UPDATE'].includes(payload.eventType)) {
              toast.info('Dados atualizados automaticamente', {
                duration: 3000,
              });
            }
          }
        )
        .subscribe();

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };
    }
  }, [enableRealtime, realtimeTable, queryKeys, queryClient, onDataChange]);

  return {
    refresh,
    isRefreshing,
    lastRefresh,
    isAutoRefreshActive: !!interval || enableRealtime
  };
};