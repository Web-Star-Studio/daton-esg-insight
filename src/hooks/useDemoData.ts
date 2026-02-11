import { useDemo } from "@/contexts/DemoContext";

interface DemoQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: null | Error;
}

/**
 * Hook utilitário que retorna mock data quando em modo demo.
 * Em modo normal, retorna o resultado do hook real.
 */
export function useDemoQuery<T>(
  realResult: DemoQueryResult<T>,
  mockData: T
): DemoQueryResult<T> {
  const { isDemo } = useDemo();

  if (isDemo) {
    return { data: mockData, isLoading: false, error: null };
  }

  return realResult;
}
