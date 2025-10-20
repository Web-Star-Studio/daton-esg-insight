/**
 * Strategic Prefetching Hook
 * Intelligently prefetches data based on user navigation patterns
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { queryKeys } from '@/constants/queryKeys';
import { logger } from '@/utils/logger';

interface PrefetchConfig {
  enabled?: boolean;
  onHover?: boolean;
  onMount?: boolean;
  delay?: number;
}

/**
 * Prefetch dashboard data when hovering over dashboard link
 */
export function usePrefetchDashboard(config: PrefetchConfig = {}) {
  const {
    enabled = true,
    onHover = true,
    onMount = false,
    delay = 100,
  } = config;

  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const prefetch = useCallback(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      logger.debug('Prefetching dashboard data', 'performance');
      
      // Prefetch key dashboard queries
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.stats,
        staleTime: 1000 * 60 * 5, // 5 minutes
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.alerts,
        staleTime: 1000 * 60 * 2, // 2 minutes
      });
    }, delay);
  }, [enabled, delay, queryClient]);

  const handleMouseEnter = useCallback(() => {
    if (onHover) prefetch();
  }, [onHover, prefetch]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (onMount) {
      prefetch();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onMount, prefetch]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    prefetch,
  };
}

/**
 * Prefetch emissions data
 */
export function usePrefetchEmissions(companyId?: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!companyId) return;

    logger.debug('Prefetching emissions data', 'performance', { companyId });

    queryClient.prefetchQuery({
      queryKey: queryKeys.emissions.all(companyId),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  }, [companyId, queryClient]);
}

/**
 * Prefetch licenses data
 */
export function usePrefetchLicenses(companyId?: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!companyId) return;

    logger.debug('Prefetching licenses data', 'performance', { companyId });

    queryClient.prefetchQuery({
      queryKey: queryKeys.licenses.all(companyId),
      staleTime: 1000 * 60 * 15, // 15 minutes (relatively static)
    });
  }, [companyId, queryClient]);
}

/**
 * Prefetch user data after successful login
 */
export function usePrefetchUserData(userId?: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!userId) return;

    logger.debug('Prefetching user data', 'performance', { userId });

    // Prefetch user profile
    queryClient.prefetchQuery({
      queryKey: queryKeys.auth.profile(userId),
      staleTime: 1000 * 60 * 30, // 30 minutes
    });
  }, [userId, queryClient]);
}

/**
 * Intelligent prefetcher that analyzes navigation patterns
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const visitedRoutes = useRef(new Set<string>());
  const routeFrequency = useRef(new Map<string, number>());

  const trackRoute = useCallback((route: string) => {
    visitedRoutes.current.add(route);
    const current = routeFrequency.current.get(route) || 0;
    routeFrequency.current.set(route, current + 1);
  }, []);

  const predictNextRoute = useCallback(() => {
    // Get most frequently visited routes
    const sorted = Array.from(routeFrequency.current.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    logger.debug('Most visited routes', 'performance', { routes: sorted });

    return sorted.map(([route]) => route);
  }, []);

  const prefetchPredictedRoutes = useCallback(() => {
    const predicted = predictNextRoute();
    
    predicted.forEach((route) => {
      if (route.includes('dashboard')) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.stats,
          staleTime: 1000 * 60 * 5,
        });
      } else if (route.includes('emissions') || route.includes('inventario-gee')) {
        // Prefetch emissions if we have company context
        logger.debug('Would prefetch emissions', 'performance');
      }
    });
  }, [predictNextRoute, queryClient]);

  return {
    trackRoute,
    predictNextRoute,
    prefetchPredictedRoutes,
  };
}
