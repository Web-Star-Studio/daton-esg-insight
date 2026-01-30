import React, { lazy, LazyExoticComponent, ComponentType, Suspense, useState, useEffect, useRef } from 'react';

// Cache for lazy components to avoid re-imports
const componentCache = new Map<string, LazyExoticComponent<any>>();

export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  cacheKey?: string
): LazyExoticComponent<ComponentType<T>> {
  if (cacheKey && componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey);
  }

  const LazyComponent = lazy(importFn);
  
  if (cacheKey) {
    componentCache.set(cacheKey, LazyComponent);
  }

  return LazyComponent;
}

// Hook for dynamic imports with loading states
export function useDynamicImport<T>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: Error | null;
  }>({
    loading: false,
    data: null,
    error: null
  });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    importFn()
      .then(data => {
        setState({ loading: false, data, error: null });
      })
      .catch(error => {
        setState({ loading: false, data: null, error });
      });
  }, deps);

  return state;
}

// Pre-built lazy components for common heavy components
export const LazyComponents = {
  IntelligenceHub: createLazyComponent(
    () => import('@/components/IntelligenceHub'), 
    'IntelligenceHub'
  ),
  
  CrossPlatformAnalytics: createLazyComponent(
    () => import('@/components/CrossPlatformAnalytics'), 
    'CrossPlatformAnalytics'
  ),
  
  SystemPerformanceMonitor: createLazyComponent(
    () => import('@/components/SystemPerformanceMonitor'), 
    'SystemPerformanceMonitor'
  ),
  
  AdvancedNotificationPanel: createLazyComponent(
    () => import('@/components/AdvancedNotificationPanel'), 
    'AdvancedNotificationPanel'
  ),
  
  IntelligentReportingDashboard: createLazyComponent(
    () => import('@/components/IntelligentReportingDashboard'), 
    'IntelligentReportingDashboard'
  ),
  
  MaterialityInteractiveMatrix: createLazyComponent<Record<string, unknown>>(
    () => import('@/components/MaterialityInteractiveMatrix').then(module => ({ default: module.MaterialityInteractiveMatrix })) as Promise<{ default: React.ComponentType<Record<string, unknown>> }>, 
    'MaterialityInteractiveMatrix'
  )
};

// Preload critical components
export function preloadCriticalComponents() {
  // Preload components that are likely to be used
  const criticalComponents = [
    'IntelligenceHub',
    'CrossPlatformAnalytics',
    'SystemPerformanceMonitor'
  ];

  criticalComponents.forEach(componentName => {
    if (LazyComponents[componentName as keyof typeof LazyComponents]) {
      // Trigger the import but don't wait for it
      LazyComponents[componentName as keyof typeof LazyComponents];
    }
  });
}

// Component intersection observer for lazy loading
export function useLazyComponentLoader(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}