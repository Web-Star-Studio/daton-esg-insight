import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

interface SmartCacheConfig<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
  gcTime?: number;
  priority?: 'high' | 'medium' | 'low';
  preloadRelated?: QueryKey[];
  backgroundRefetch?: boolean;
}

const PRIORITY_SETTINGS = {
  high: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 }, // 5min stale, 30min gc
  medium: { staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000 }, // 10min stale, 20min gc  
  low: { staleTime: 15 * 60 * 1000, gcTime: 10 * 60 * 1000 } // 15min stale, 10min gc
};

export const useSmartCache = <T>({
  queryKey,
  queryFn,
  priority = 'medium',
  preloadRelated = [],
  backgroundRefetch = true,
  ...config
}: SmartCacheConfig<T>) => {
  const queryClient = useQueryClient();
  
  const prioritySettings = PRIORITY_SETTINGS[priority];
  
  const queryConfig = useMemo(() => ({
    queryKey,
    queryFn,
    staleTime: config.staleTime || prioritySettings.staleTime,
    gcTime: config.gcTime || prioritySettings.gcTime,
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: backgroundRefetch,
    retry: priority === 'high' ? 3 : priority === 'medium' ? 2 : 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }), [queryKey, queryFn, config.staleTime, config.gcTime, prioritySettings, backgroundRefetch, priority]);

  const query = useQuery(queryConfig);

  // Preload related queries when this query succeeds
  useEffect(() => {
    if (query.isSuccess && query.data && preloadRelated.length > 0) {
      preloadRelated.forEach(relatedKey => {
        // Check if related query is already cached
        const cachedData = queryClient.getQueryData(relatedKey);
        if (!cachedData) {
          // Prefetch with lower priority
          queryClient.prefetchQuery({
            queryKey: relatedKey,
            staleTime: prioritySettings.staleTime * 2, // Double stale time for prefetched data
          });
        }
      });
    }
  }, [query.isSuccess, query.data, preloadRelated, queryClient, prioritySettings.staleTime]);

  // Smart invalidation - invalidate related queries when this one changes
  const invalidateRelated = () => {
    preloadRelated.forEach(relatedKey => {
      queryClient.invalidateQueries({ queryKey: relatedKey });
    });
  };

  // Optimistic update helper
  const optimisticUpdate = (updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
    
    // Also update related queries if they might be affected
    preloadRelated.forEach(relatedKey => {
      const relatedData = queryClient.getQueryData(relatedKey);
      if (relatedData) {
        queryClient.invalidateQueries({ queryKey: relatedKey });
      }
    });
  };

  return {
    ...query,
    invalidateRelated,
    optimisticUpdate,
    cacheInfo: {
      priority,
      staleTime: queryConfig.staleTime,
      gcTime: queryConfig.gcTime,
      lastFetched: query.dataUpdatedAt,
      isCached: !!queryClient.getQueryData(queryKey),
    }
  };
};