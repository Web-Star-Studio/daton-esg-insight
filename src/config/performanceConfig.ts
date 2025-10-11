// Centralized performance configuration
export const PERFORMANCE_CONFIG = {
  // Query caching durations (in milliseconds)
  cache: {
    critical: 2 * 60 * 1000,      // 2 minutes for critical data
    standard: 5 * 60 * 1000,      // 5 minutes for standard data
    static: 30 * 60 * 1000,       // 30 minutes for static/reference data
  },
  
  // Real-time subscription settings
  realtime: {
    debounce: 500,                // Debounce realtime updates by 500ms
    maxSubscriptions: 5,          // Max concurrent subscriptions
  },
  
  // Virtualization settings
  virtualization: {
    itemHeight: 72,               // Standard list item height
    overscan: 5,                  // Number of items to render outside viewport
    threshold: 50,                // Enable virtualization for lists > 50 items
  },
  
  // Lazy loading settings
  lazyLoading: {
    threshold: 0.1,               // Start loading when 10% visible
    rootMargin: '100px',          // Start loading 100px before visible
  },
  
  // Prefetch routes for common navigation paths
  prefetchRoutes: [
    '/inventario-gee',
    '/metas',
    '/gestao-tarefas',
    '/documentos',
    '/licenciamento',
  ],
} as const;
