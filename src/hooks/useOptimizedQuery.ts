import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { PERFORMANCE_CONFIG } from '@/config/performanceConfig';

interface OptimizedQueryConfig<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  priority?: 'critical' | 'standard' | 'static';
  prefetchRelated?: Array<{
    key: QueryKey;
    fn: () => Promise<any>;
  }>;
  enabled?: boolean;
}

/**
 * Optimized query hook with automatic prefetching and caching
 */
export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  priority = 'standard',
  prefetchRelated = [],
  enabled = true,
}: OptimizedQueryConfig<T>) {
  const queryClient = useQueryClient();

  // Get cache duration based on priority
  const staleTime = PERFORMANCE_CONFIG.cache[priority];

  // Configure query with optimized settings
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache twice as long as stale time
    enabled,
    refetchOnWindowFocus: priority === 'critical',
    refetchOnReconnect: priority === 'critical',
    retry: priority === 'critical' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefetch related queries when main query succeeds
  useEffect(() => {
    if (query.isSuccess && query.data && prefetchRelated.length > 0) {
      prefetchRelated.forEach(({ key, fn }) => {
        const cached = queryClient.getQueryData(key);
        if (!cached) {
          queryClient.prefetchQuery({
            queryKey: key,
            queryFn: fn,
            staleTime: PERFORMANCE_CONFIG.cache.standard,
          });
        }
      });
    }
  }, [query.isSuccess, query.data, prefetchRelated, queryClient]);

  // Cache metadata
  const cacheInfo = useMemo(
    () => ({
      priority,
      staleTime,
      lastFetched: query.dataUpdatedAt,
      isCached: !!queryClient.getQueryData(queryKey),
      isStale: query.isStale,
    }),
    [priority, staleTime, query.dataUpdatedAt, query.isStale, queryClient, queryKey]
  );

  return {
    ...query,
    cacheInfo,
  };
}
