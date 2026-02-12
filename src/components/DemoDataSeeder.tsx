import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDemo } from '@/contexts/DemoContext';
import { getAllDemoMockData } from '@/data/demo';

/**
 * Seeds the React Query cache with mock data when in demo mode.
 * Prevents queries from hitting Supabase by setting staleTime to Infinity.
 */
export function DemoDataSeeder({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();
  const seeded = useRef(false);

  useEffect(() => {
    if (!isDemo || seeded.current) return;

    // Seed all known query keys with mock data
    const mockEntries = getAllDemoMockData();
    mockEntries.forEach(({ queryKey, data }) => {
      queryClient.setQueryData(queryKey as string[], data);
    });

    // Override default options to prevent refetching in demo mode
    queryClient.setDefaultOptions({
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        staleTime: Infinity,
        retry: false,
      },
    });

    seeded.current = true;
  }, [isDemo, queryClient]);

  return <>{children}</>;
}
