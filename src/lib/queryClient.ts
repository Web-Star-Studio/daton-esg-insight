import { QueryClient } from '@tanstack/react-query';
import { errorHandler } from '@/utils/errorHandler';

// Query client centralizado com cache inteligente
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount: number, error: Error) => {
        // Não retentar em erros de autenticação
        const errorObj = error as any;
        if (errorObj?.status === 401 || errorObj?.code === 'PGRST116') return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error: Error) => {
        errorHandler.showUserError(error, {
          component: 'QueryClient',
          function: 'mutation'
        });
      },
    },
  },
});
