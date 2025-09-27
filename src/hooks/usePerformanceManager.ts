import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Consolidated types for performance management
export interface SystemMetrics {
  performance_score: number;
  memory_usage: number;
  api_response_time: number;
  cache_hit_rate: number;
  active_users: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: Date;
}

export interface OptimizationSettings {
  auto_refresh_enabled: boolean;
  cache_duration: number;
  background_sync: boolean;
  performance_mode: 'balanced' | 'performance' | 'battery';
  notification_throttle: number;
}

export interface SmartQueryConfig<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  priority?: 'high' | 'medium' | 'low';
  staleTime?: number;
  gcTime?: number;
  preloadRelated?: QueryKey[];
  backgroundRefetch?: boolean;
  retry?: number | boolean;
  enabled?: boolean;
}

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

const PRIORITY_SETTINGS = {
  high: { staleTime: 2 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 3 },
  medium: { staleTime: 5 * 60 * 1000, gcTime: 20 * 60 * 1000, retry: 2 },
  low: { staleTime: 10 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1 }
};

// Main performance manager hook
export const usePerformanceManager = () => {
  const queryClient = useQueryClient();
  
  // System metrics state
  const [metrics, setMetrics] = useState<SystemMetrics>({
    performance_score: 95,
    memory_usage: 42,
    api_response_time: 120,
    cache_hit_rate: 89,
    active_users: 1,
    system_health: 'excellent',
    last_updated: new Date()
  });

  // Optimization settings
  const [settings, setSettings] = useState<OptimizationSettings>({
    auto_refresh_enabled: true,
    cache_duration: 300000,
    background_sync: true,
    performance_mode: 'balanced',
    notification_throttle: 5000
  });

  // Real-time metrics simulation
  useEffect(() => {
    if (!settings.auto_refresh_enabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        performance_score: Math.max(85, Math.min(100, prev.performance_score + (Math.random() - 0.5) * 3)),
        memory_usage: Math.max(20, Math.min(80, prev.memory_usage + (Math.random() - 0.5) * 5)),
        api_response_time: Math.max(50, Math.min(300, prev.api_response_time + (Math.random() - 0.5) * 20)),
        cache_hit_rate: Math.max(70, Math.min(95, prev.cache_hit_rate + (Math.random() - 0.5) * 2)),
        last_updated: new Date()
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, [settings.auto_refresh_enabled]);

  // Smart cache optimization
  const optimizeCache = useCallback(() => {
    queryClient.clear();
    
    const criticalQueries = [
      'quality-dashboard',
      'esg-dashboard',
      'emission-stats',
      'smart-report-templates'
    ];

    criticalQueries.forEach(key => {
      queryClient.prefetchQuery({
        queryKey: [key],
        staleTime: settings.cache_duration,
      });
    });
  }, [queryClient, settings.cache_duration]);

  // System health calculation
  const getSystemStatus = useCallback(() => {
    const { performance_score, memory_usage, api_response_time } = metrics;
    
    if (performance_score > 90 && memory_usage < 50 && api_response_time < 150) {
      return 'excellent';
    } else if (performance_score > 80 && memory_usage < 70 && api_response_time < 200) {
      return 'good';
    } else if (performance_score > 70 && memory_usage < 85 && api_response_time < 300) {
      return 'warning';
    } else {
      return 'critical';
    }
  }, [metrics]);

  // Performance mode adjustments
  useEffect(() => {
    switch (settings.performance_mode) {
      case 'performance':
        setSettings(prev => ({
          ...prev,
          cache_duration: 600000,
          notification_throttle: 2000
        }));
        break;
      case 'battery':
        setSettings(prev => ({
          ...prev,
          cache_duration: 1800000,
          notification_throttle: 10000,
          auto_refresh_enabled: false
        }));
        break;
      default:
        break;
    }
  }, [settings.performance_mode]);

  return {
    metrics: {
      ...metrics,
      system_health: getSystemStatus()
    },
    settings,
    updateSettings: setSettings,
    optimizeCache,
    isOptimized: metrics.performance_score > 85,
    recommendations: {
      cache_optimization: metrics.cache_hit_rate < 80,
      memory_cleanup: metrics.memory_usage > 75,
      api_optimization: metrics.api_response_time > 250
    }
  };
};

// Smart query hook with unified optimizations
export function useSmartQuery<T>(config: SmartQueryConfig<T>) {
  const queryClient = useQueryClient();
  const { priority = 'medium', preloadRelated = [], backgroundRefetch = true, ...options } = config;
  
  const prioritySettings = PRIORITY_SETTINGS[priority];
  
  const queryConfig = useMemo(() => ({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    staleTime: options.staleTime || prioritySettings.staleTime,
    gcTime: options.gcTime || prioritySettings.gcTime,
    retry: options.retry || prioritySettings.retry,
    enabled: options.enabled ?? true,
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: backgroundRefetch,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }), [config.queryKey, config.queryFn, options, prioritySettings, backgroundRefetch]);

  const query = useQuery(queryConfig);

  // Preload related queries
  useEffect(() => {
    if (query.isSuccess && query.data && preloadRelated.length > 0) {
      preloadRelated.forEach(relatedKey => {
        const cachedData = queryClient.getQueryData(relatedKey);
        if (!cachedData) {
          queryClient.prefetchQuery({
            queryKey: relatedKey,
            staleTime: prioritySettings.staleTime * 2,
          });
        }
      });
    }
  }, [query.isSuccess, query.data, preloadRelated, queryClient, prioritySettings.staleTime]);

  // Utility functions
  const prefetch = useCallback(
    (newQueryKey: QueryKey, newQueryFn: () => Promise<any>) => {
      queryClient.prefetchQuery({
        queryKey: newQueryKey,
        queryFn: newQueryFn,
        staleTime: queryConfig.staleTime,
      });
    },
    [queryClient, queryConfig.staleTime]
  );

  const optimisticUpdate = useCallback(
    (updater: (oldData: T | undefined) => T) => {
      queryClient.setQueryData(config.queryKey, updater);
      preloadRelated.forEach(relatedKey => {
        queryClient.invalidateQueries({ queryKey: relatedKey });
      });
    },
    [queryClient, config.queryKey, preloadRelated]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: config.queryKey });
  }, [queryClient, config.queryKey]);

  return {
    ...query,
    prefetch,
    optimisticUpdate,
    invalidate,
    cacheInfo: {
      priority,
      staleTime: queryConfig.staleTime,
      gcTime: queryConfig.gcTime,
      lastFetched: query.dataUpdatedAt,
      isCached: !!queryClient.getQueryData(config.queryKey),
    }
  };
}

// Real-time data management hook
export const useRealTimeManager = (configs: RealTimeConfig[]) => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const channelsRef = useRef<any[]>([]);
  const debounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const channels: any[] = [];

    configs.forEach((config, index) => {
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
          setLastActivity(new Date());
          
          const debounceKey = `${config.table}-${JSON.stringify(config.queryKey)}`;
          const existingTimeout = debounceTimeoutsRef.current.get(debounceKey);
          
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: config.queryKey });

            if (payload.eventType === 'INSERT' && config.onInsert) {
              config.onInsert(payload);
            } else if (payload.eventType === 'UPDATE' && config.onUpdate) {
              config.onUpdate(payload);
            } else if (payload.eventType === 'DELETE' && config.onDelete) {
              config.onDelete(payload);
            }

            showRealTimeNotification(config.table, payload.eventType);
            debounceTimeoutsRef.current.delete(debounceKey);
          }, config.debounceMs || 500);

          debounceTimeoutsRef.current.set(debounceKey, timeout);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
          }
        });

      channels.push(channel);
    });

    channelsRef.current = channels;

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      debounceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      debounceTimeoutsRef.current.clear();
      setConnectionStatus('disconnected');
    };
  }, [configs, queryClient]);

  const showRealTimeNotification = (table: string, eventType: string) => {
    const tableLabels: Record<string, string> = {
      'calculated_emissions': 'Emissões',
      'licenses': 'Licenças',
      'goals': 'Metas',
      'assets': 'Ativos'
    };

    const eventLabels: Record<string, string> = {
      'INSERT': 'criado',
      'UPDATE': 'atualizado',
      'DELETE': 'removido'
    };

    const tableName = tableLabels[table] || table;
    const eventName = eventLabels[eventType] || eventType;

    if (['INSERT', 'UPDATE', 'DELETE'].includes(eventType) && tableLabels[table]) {
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

  return {
    connectionStatus,
    lastActivity,
    forceRefresh,
    isConnected: connectionStatus === 'connected',
    getConnectionInfo: () => ({
      status: connectionStatus,
      lastActivity,
      activeChannels: channelsRef.current.length,
      isHealthy: connectionStatus === 'connected' && 
                (new Date().getTime() - lastActivity.getTime()) < 60000
    })
  };
};

// Cache management utilities
export function useCacheManager() {
  const queryClient = useQueryClient();

  const clearCache = useCallback(
    (pattern?: string) => {
      if (pattern) {
        queryClient.removeQueries({
          predicate: (query) => 
            query.queryKey.some(key => 
              typeof key === 'string' && key.includes(pattern)
            )
        });
      } else {
        queryClient.clear();
      }
    },
    [queryClient]
  );

  const warmCache = useCallback(
    async (queries: Array<{ key: QueryKey; fn: () => Promise<any> }>) => {
      const promises = queries.map(({ key, fn }) =>
        queryClient.prefetchQuery({
          queryKey: key,
          queryFn: fn,
          staleTime: 5 * 60 * 1000,
        })
      );
      
      await Promise.allSettled(promises);
    },
    [queryClient]
  );

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    return {
      totalQueries: cache.getAll().length,
      staleQueries: cache.getAll().filter(q => q.isStale()).length,
      fetchingQueries: cache.getAll().filter(q => q.state.status === 'pending').length,
    };
  }, [queryClient]);

  return {
    clearCache,
    warmCache,
    getCacheStats,
  };
}