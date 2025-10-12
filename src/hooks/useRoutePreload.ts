/**
 * Route Preloading Hook
 * Automatically preloads routes on hover and idle
 */

import { useEffect } from 'react';
import { preloadRoute, preloadCommonRoutes, setupLinkPreloading } from '@/utils/routePreloader';

/**
 * Hook to enable route preloading
 */
export function useRoutePreload() {
  useEffect(() => {
    // Preload common routes on idle
    preloadCommonRoutes();

    // Set up hover-based preloading
    setupLinkPreloading();
  }, []);

  return {
    preloadRoute,
  };
}

/**
 * Hook to preload specific route on mount
 */
export function usePreloadRoute(routePath: string) {
  useEffect(() => {
    preloadRoute(routePath);
  }, [routePath]);
}
