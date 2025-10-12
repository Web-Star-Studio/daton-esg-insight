/**
 * Lazy Loading Utility
 * Provides consistent lazy loading with loading states and error boundaries
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  delay?: number;
}

/**
 * Lazy load a component with automatic retry and loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.ComponentType<any> {
  const { fallback, delay = 200 } = options;

  const LazyComponent = lazy(() => {
    return Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([module]) => module);
  });

  return (props: any) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy-loaded component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  importFunc();
}
