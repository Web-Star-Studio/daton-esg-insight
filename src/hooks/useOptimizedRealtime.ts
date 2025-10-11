import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PERFORMANCE_CONFIG } from '@/config/performanceConfig';

interface RealtimeConfig {
  table: string;
  queryKey: string[];
  filter?: { column: string; value: any };
  enabled?: boolean;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Optimized real-time subscription with debouncing and automatic cleanup
 */
export function useOptimizedRealtime(configs: RealtimeConfig[]) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<any[]>([]);
  const debounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Only subscribe to enabled configs
    const enabledConfigs = configs.filter((c) => c.enabled !== false);

    // Limit concurrent subscriptions
    const limitedConfigs = enabledConfigs.slice(
      0,
      PERFORMANCE_CONFIG.realtime.maxSubscriptions
    );

    const channels: any[] = [];

    limitedConfigs.forEach((config, index) => {
      const channelName = `realtime-${config.table}-${index}`;

      let subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table: config.table,
      };

      if (config.filter) {
        subscriptionConfig.filter = `${config.filter.column}=eq.${config.filter.value}`;
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', subscriptionConfig, (payload) => {
          const debounceKey = `${config.table}-${JSON.stringify(config.queryKey)}`;
          const existingTimeout = debounceTimeoutsRef.current.get(debounceKey);

          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Debounce updates to avoid excessive re-renders
          const timeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: config.queryKey });

            // Call event handlers
            if (payload.eventType === 'INSERT' && config.onInsert) {
              config.onInsert(payload);
            } else if (payload.eventType === 'UPDATE' && config.onUpdate) {
              config.onUpdate(payload);
            } else if (payload.eventType === 'DELETE' && config.onDelete) {
              config.onDelete(payload);
            }

            debounceTimeoutsRef.current.delete(debounceKey);
          }, PERFORMANCE_CONFIG.realtime.debounce);

          debounceTimeoutsRef.current.set(debounceKey, timeout);
        })
        .subscribe();

      channels.push(channel);
    });

    channelsRef.current = channels;

    // Cleanup
    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
      debounceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      debounceTimeoutsRef.current.clear();
    };
  }, [configs, queryClient]);

  const forceRefresh = useCallback(() => {
    configs.forEach((config) => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    });
  }, [configs, queryClient]);

  return {
    forceRefresh,
    activeSubscriptions: channelsRef.current.length,
  };
}
