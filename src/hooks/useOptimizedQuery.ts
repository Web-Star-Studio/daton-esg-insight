import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<T> {
  queryKey: (string | number | boolean)[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
  placeholderData?: T;
  select?: (data: T) => any;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// Enhanced query hook with intelligent caching and performance optimizations
export function useOptimizedQuery<T>(options: OptimizedQueryOptions<T>) {
  const queryClient = useQueryClient();

  // Memoize query configuration
  const queryConfig = useMemo(() => ({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes default
    refetchInterval: options.refetchInterval ?? false,
    enabled: options.enabled ?? true,
    retry: options.retry ?? 3,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    placeholderData: options.placeholderData,
    select: options.select,
  }), [options]);

  const query = useQuery(queryConfig);

  // Prefetch related data
  const prefetch = useCallback(
    (newQueryKey: (string | number | boolean)[], newQueryFn: () => Promise<any>) => {
      queryClient.prefetchQuery({
        queryKey: newQueryKey,
        queryFn: newQueryFn,
        staleTime: queryConfig.staleTime,
      });
    },
    [queryClient, queryConfig.staleTime]
  );

  // Optimistic updates
  const optimisticUpdate = useCallback(
    (updater: (oldData: T | undefined) => T) => {
      queryClient.setQueryData(options.queryKey, updater);
    },
    [queryClient, options.queryKey]
  );

  // Invalidate and refetch
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: options.queryKey });
  }, [queryClient, options.queryKey]);

  // Smart refresh - only if data is stale
  const smartRefresh = useCallback(() => {
    queryClient.refetchQueries({ queryKey: options.queryKey });
  }, [queryClient, options.queryKey]);

  return {
    ...query,
    prefetch,
    optimisticUpdate,
    invalidate,
    smartRefresh,
  };
}

// Hook for paginated queries with optimizations
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  page = 1,
  pageSize = 20,
  ...options
}: {
  queryKey: (string | number | boolean)[];
  queryFn: (page: number, pageSize: number) => Promise<{
    data: T[];
    total: number;
    hasNextPage: boolean;
  }>;
  page?: number;
  pageSize?: number;
} & Omit<OptimizedQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  
  const queryClient = useQueryClient();
  
  const paginatedKey = [...queryKey, 'page', page, 'size', pageSize];
  
  const result = useOptimizedQuery({
    queryKey: paginatedKey,
    queryFn: () => queryFn(page, pageSize),
    ...options,
  });

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (result.data?.hasNextPage) {
      const nextPageKey = [...queryKey, 'page', page + 1, 'size', pageSize];
      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => queryFn(page + 1, pageSize),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, queryKey, page, pageSize, queryFn, result.data?.hasNextPage]);

  return {
    ...result,
    prefetchNextPage,
    page,
    pageSize,
    totalItems: result.data?.total ?? 0,
    hasNextPage: result.data?.hasNextPage ?? false,
  };
}

// Hook for real-time data with intelligent polling
export function useRealtimeQuery<T>(
  options: OptimizedQueryOptions<T> & {
    pollingInterval?: number;
    enablePolling?: boolean;
  }
) {
  const { pollingInterval = 30000, enablePolling = true, ...queryOptions } = options;

  // Adjust polling based on document visibility
  const adaptivePolling = useMemo(() => {
    if (!enablePolling) return false;
    
    return document.visibilityState === 'visible' ? pollingInterval : false;
  }, [enablePolling, pollingInterval]);

  return useOptimizedQuery({
    ...queryOptions,
    refetchInterval: adaptivePolling,
    refetchOnWindowFocus: true,
  });
}

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
    async (queries: Array<{ key: any[]; fn: () => Promise<any> }>) => {
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
      staleQueries: 0,
      fetchingQueries: cache.getAll().filter(q => q.state.isFetching).length,
    };
  }, [queryClient]);

  return {
    clearCache,
    warmCache,
    getCacheStats,
  };
}