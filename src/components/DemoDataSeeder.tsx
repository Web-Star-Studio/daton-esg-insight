import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDemo } from '@/contexts/DemoContext';
import { getAllDemoMockData } from '@/data/demo';
import { createDemoQueryResolver } from '@/data/demo/queryResolver';

/**
 * Seeds and enforces mock data in demo mode.
 * Also overrides new query instances to avoid live queryFns for dynamic keys.
 */
export function DemoDataSeeder({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();
  const seeded = useRef(false);

  useEffect(() => {
    if (!isDemo || seeded.current) return;

    const mockEntries = getAllDemoMockData();
    const resolveDemoQuery = createDemoQueryResolver(mockEntries);

    // Seed cache with explicit entries
    mockEntries.forEach(({ queryKey, data }) => {
      queryClient.setQueryData(queryKey, data);
    });

    const applyDemoQueryOverrides = (query: unknown) => {
      const typedQuery = query as {
        queryKey?: readonly unknown[];
        options?: Record<string, unknown>;
        setOptions?: (options: Record<string, unknown>) => void;
      };

      const key = typedQuery.queryKey || [];
      if (!key.length) return;

      if (queryClient.getQueryData(key) === undefined) {
        queryClient.setQueryData(key, resolveDemoQuery(key));
      }

      if (typeof typedQuery.setOptions === 'function') {
        typedQuery.setOptions({
          ...(typedQuery.options || {}),
          queryFn: async () => resolveDemoQuery(key),
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchInterval: false,
        });
      }
    };

    // Defaults for any query without explicit options.
    queryClient.setDefaultOptions({
      queries: {
        queryFn: async ({ queryKey }) => resolveDemoQuery(queryKey),
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
      },
    });

    // Patch existing and newly added queries to prevent live queryFns in demo mode.
    const queryCache = queryClient.getQueryCache();
    queryCache.getAll().forEach(applyDemoQueryOverrides);

    const unsubscribe = queryCache.subscribe((event) => {
      const typedEvent = event as { type?: string; query?: unknown };
      if (typedEvent.type === 'added' && typedEvent.query) {
        applyDemoQueryOverrides(typedEvent.query);
      }
    });

    seeded.current = true;
    return () => unsubscribe();
  }, [isDemo, queryClient]);

  return <>{children}</>;
}
