import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDemo } from '@/contexts/DemoContext';
import { getAllDemoMockData } from '@/data/demo';

/**
 * Seeds the React Query cache with mock data when in demo mode.
 * Uses prefix-based matching so dynamic queryKeys find their base mock data.
 * Falls back to null for unmapped queries to prevent Supabase calls.
 */
export function DemoDataSeeder({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();
  const seeded = useRef(false);

  useEffect(() => {
    if (!isDemo || seeded.current) return;

    const mockEntries = getAllDemoMockData();

    // Build lookup map: exact JSON key -> data
    const mockMap = new Map<string, unknown>();
    // Build prefix map: first element of queryKey -> data (for dynamic params)
    const prefixMap = new Map<string, unknown>();

    mockEntries.forEach(({ queryKey, data }) => {
      const key = JSON.stringify(queryKey);
      mockMap.set(key, data);
      // Store prefix (first element) - first match wins
      const prefix = String(queryKey[0]);
      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, data);
      }
    });

    // Seed cache with all known entries
    mockEntries.forEach(({ queryKey, data }) => {
      queryClient.setQueryData(queryKey as string[], data);
    });

    // Override defaults with global queryFn that intercepts all queries
    queryClient.setDefaultOptions({
      queries: {
        queryFn: ({ queryKey }) => {
          // 1. Exact match
          const exactKey = JSON.stringify(queryKey);
          if (mockMap.has(exactKey)) return mockMap.get(exactKey);

          // 2. Prefix match (first element of queryKey)
          const prefix = String(queryKey[0]);
          if (prefixMap.has(prefix)) return prefixMap.get(prefix);

          // 3. Fallback: return null to prevent Supabase calls
          return null;
        },
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
      },
    });

    seeded.current = true;
  }, [isDemo, queryClient]);

  return <>{children}</>;
}
