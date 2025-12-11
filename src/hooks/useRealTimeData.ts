import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface RealTimeConfig {
  table: string;
  queryKey: string[];
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  filter?: { column: string; value: any };
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  debounceMs?: number;
}

export const useRealTimeData = (configs: RealTimeConfig[]) => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const channelsRef = useRef<any[]>([]);
  const debounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const errorCountRef = useRef<number>(0);

  // Check authentication status before subscribing
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      // Reset error count on auth change
      errorCountRef.current = 0;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Only subscribe if authenticated
    if (!isAuthenticated) {
      logger.debug('RealTimeData: Skipping subscription - user not authenticated', 'api');
      setConnectionStatus('disconnected');
      return;
    }

    const channels: any[] = [];

    configs.forEach((config, index) => {
      const channelName = `realtime-${config.table}-${index}`;
      
      let subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table: config.table,
      };

      // Add filter if specified
      if (config.filter) {
        subscriptionConfig.filter = `${config.filter.column}=eq.${config.filter.value}`;
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', subscriptionConfig, (payload) => {
          setLastActivity(new Date());
          
          // Debounce updates to prevent too many re-renders
          const debounceKey = `${config.table}-${JSON.stringify(config.queryKey)}`;
          const existingTimeout = debounceTimeoutsRef.current.get(debounceKey);
          
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeout = setTimeout(() => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: config.queryKey });

            // Handle specific events
            if (payload.eventType === 'INSERT' && config.onInsert) {
              config.onInsert(payload);
            } else if (payload.eventType === 'UPDATE' && config.onUpdate) {
              config.onUpdate(payload);
            } else if (payload.eventType === 'DELETE' && config.onDelete) {
              config.onDelete(payload);
            }

            // Show user feedback for important changes
            showRealTimeNotification(config.table, payload.eventType, payload);
            
            debounceTimeoutsRef.current.delete(debounceKey);
          }, config.debounceMs || 500);

          debounceTimeoutsRef.current.set(debounceKey, timeout);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            errorCountRef.current = 0;
            logger.info(`RealTimeData: Channel ${config.table} connected`, 'api');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
            errorCountRef.current++;
            
            // Only log warning once per table, not spam
            if (errorCountRef.current <= 3) {
              logger.warn(`RealTimeData: Channel ${config.table} error (attempt ${errorCountRef.current})`, 'api');
            }
            
            // Only show toast on first error
            if (errorCountRef.current === 1) {
              toast.error(`Erro na conexão em tempo real para ${config.table}`, {
                duration: 3000,
              });
            }
          } else if (status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            logger.warn(`RealTimeData: Channel ${config.table} timed out`, 'api');
          }
        });

      channels.push(channel);
    });

    channelsRef.current = channels;

    return () => {
      // Cleanup channels
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      // Cleanup debounce timeouts
      debounceTimeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      debounceTimeoutsRef.current.clear();
      
      setConnectionStatus('disconnected');
    };
  }, [configs, queryClient, isAuthenticated]);

  const showRealTimeNotification = (table: string, eventType: string, payload: any) => {
    const tableLabels: Record<string, string> = {
      'calculated_emissions': 'Emissões',
      'licenses': 'Licenças',
      'goals': 'Metas',
      'audit_logs': 'Auditoria',
      'assets': 'Ativos',
      'waste_logs': 'Resíduos',
      'notifications': 'Notificações'
    };

    const eventLabels: Record<string, string> = {
      'INSERT': 'criado',
      'UPDATE': 'atualizado',
      'DELETE': 'removido'
    };

    const tableName = tableLabels[table] || table;
    const eventName = eventLabels[eventType] || eventType;

    // Only show notifications for important events
    const importantEvents = ['INSERT', 'UPDATE', 'DELETE'];
    const importantTables = ['calculated_emissions', 'licenses', 'goals', 'audit_logs'];

    if (importantEvents.includes(eventType) && importantTables.includes(table)) {
      toast.info(`${tableName} ${eventName}`, {
        description: 'Dados atualizados automaticamente',
        duration: 3000,
      });
    }
  };

  const forceRefresh = () => {
    configs.forEach(config => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    });
    setLastActivity(new Date());
  };

  const getConnectionInfo = () => ({
    status: connectionStatus,
    lastActivity,
    activeChannels: channelsRef.current.length,
    isHealthy: connectionStatus === 'connected' && 
               (new Date().getTime() - lastActivity.getTime()) < 60000 // Less than 1 minute
  });

  return {
    connectionStatus,
    lastActivity,
    forceRefresh,
    getConnectionInfo,
    isConnected: connectionStatus === 'connected'
  };
};