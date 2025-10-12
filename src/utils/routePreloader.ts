/**
 * Route Preloader
 * Preloads routes that users are likely to navigate to
 */

import { PERFORMANCE_CONFIG } from '@/config/performanceConfig';

const preloadedRoutes = new Set<string>();

/**
 * Preload a route component
 */
export async function preloadRoute(routePath: string): Promise<void> {
  if (preloadedRoutes.has(routePath)) {
    return;
  }

  try {
    // Dynamic import based on route path
    const routeMap: Record<string, () => Promise<any>> = {
      '/inventario-gee': () => import('@/pages/InventarioGEE'),
      '/metas': () => import('@/pages/Metas'),
      '/documentos': () => import('@/pages/Documentos'),
      '/licenciamento': () => import('@/pages/Licenciamento'),
      '/residuos': () => import('@/pages/Residuos'),
      '/gestao-esg': () => import('@/pages/GestaoESG'),
      '/advanced-analytics': () => import('@/pages/AdvancedAnalytics'),
      '/ia-insights': () => import('@/pages/IAInsights'),
      '/configuracao': () => import('@/pages/Configuracao'),
    };

    const importFunc = routeMap[routePath];
    if (importFunc) {
      await importFunc();
      preloadedRoutes.add(routePath);
      console.debug(`✅ Preloaded route: ${routePath}`);
    }
  } catch (error) {
    console.error(`Failed to preload route ${routePath}:`, error);
  }
}

/**
 * Preload common routes on idle
 */
export function preloadCommonRoutes(): void {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 1000);
    }
  };

  schedulePreload(() => {
    PERFORMANCE_CONFIG.prefetchRoutes.forEach(route => {
      preloadRoute(route);
    });
  });
}

/**
 * Preload route on hover (for navigation links)
 */
export function setupLinkPreloading(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href.includes(window.location.origin)) {
      const path = new URL(link.href).pathname;
      preloadRoute(path);
    }
  });
}
