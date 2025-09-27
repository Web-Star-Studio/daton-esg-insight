// Performance optimization utilities for React components

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { errorHandler } from './errorHandler';

// Debounce hook with cleanup
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: T) => {
      if (Date.now() - lastRun.current >= delay) {
        fn(...args);
        lastRun.current = Date.now();
      }
    },
    [fn, delay]
  );
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
  callback?: (isIntersecting: boolean) => void
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        callback?.(intersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, callback, options]);

  return isIntersecting;
}

// Safe async operation hook
export function useSafeAsync<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  deps: React.DependencyList = []
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: false, error: null });

  const execute = useCallback(
    async (...args: Args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await asyncFn(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState({ data: null, loading: false, error: err });
        
        errorHandler.handle(err, {
          component: 'useSafeAsync',
          function: asyncFn.name || 'anonymous'
        });
        
        throw err;
      }
    },
    deps
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(
          `⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    }
  });

  return {
    renderCount: renderCount.current
  };
}

// Memory-efficient list virtualization helper
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop
  };
}

// Import React hook
import { useState } from 'react';