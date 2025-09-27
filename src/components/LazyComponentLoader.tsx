import React, { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazyComponentLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadingDelay?: number;
  retryAttempts?: number;
  preload?: boolean;
  threshold?: number;
}

interface LazyLoadConfig {
  componentPath: string;
  chunkName?: string;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// Cache para componentes carregados
const componentCache = new Map<string, ComponentType<any>>();

// Configurações de lazy loading por rota/componente
export const LAZY_LOAD_CONFIG: Record<string, LazyLoadConfig> = {
  'CustomizableDashboard': {
    componentPath: '@/components/CustomizableDashboard',
    chunkName: 'dashboard-customization',
    priority: 'high'
  },
  'GRIReporting': {
    componentPath: '@/components/GRIReporting',
    chunkName: 'gri-reporting',
    priority: 'medium'
  },
  'AdvancedCharts': {
    componentPath: '@/components/AdvancedCharts',
    chunkName: 'advanced-charts',
    priority: 'medium'
  },
  'DataVisualization': {
    componentPath: '@/components/DataVisualization',
    chunkName: 'data-visualization',
    priority: 'low'
  },
  'ReportingModule': {
    componentPath: '@/components/ReportingModule',
    chunkName: 'reporting-module',
    priority: 'medium'
  }
};

export function LazyComponentLoader({
  children,
  fallback,
  errorFallback,
  loadingDelay = 200,
  retryAttempts = 3,
  preload = false,
  threshold = 0.1
}: LazyComponentLoaderProps) {
  const defaultFallback = (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  const defaultErrorFallback = (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-destructive">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Erro ao carregar componente</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tente recarregar a página ou entre em contato com o suporte
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}

// Factory para criar componentes lazy com configuração inteligente
export function createLazyComponent<T = {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  config?: {
    retryAttempts?: number;
    chunkName?: string;
    preload?: boolean;
    fallback?: ReactNode;
  }
) {
  const {
    retryAttempts = 3,
    chunkName = 'lazy-component',
    preload = false,
    fallback
  } = config || {};

  // Criar função de import com retry
  const importWithRetry = async (attempt = 1): Promise<{ default: ComponentType<T> }> => {
    try {
      const module = await importFunc();
      console.log(`✅ Lazy component loaded: ${chunkName}`);
      return module;
    } catch (error) {
      console.warn(`❌ Failed to load ${chunkName} (attempt ${attempt}):`, error);
      
      if (attempt < retryAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return importWithRetry(attempt + 1);
      }
      
      throw error;
    }
  };

  const LazyComponent = lazy(() => importWithRetry());

  // Preload se solicitado
  if (preload) {
    importWithRetry().catch(console.warn);
  }

  // Retornar componente wrapped
  return (props: T) => (
    <LazyComponentLoader fallback={fallback}>
      <LazyComponent {...(props as any)} />
    </LazyComponentLoader>
  );
}

// Hook para lazy loading baseado em intersection observer
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  componentLoader: () => Promise<void>,
  options?: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  }
) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options || {};

  const { ref, isIntersecting, entry } = useIntersectionObserver<T>({
    threshold,
    rootMargin,
    triggerOnce
  });

  // Carregar componente quando entrar na viewport
  if (isIntersecting && entry) {
    componentLoader().catch(console.warn);
  }

  return { ref, isIntersecting };
}

// Componente de lazy loading inteligente baseado em viewport
export function ViewportLazyLoader<T = {}>({
  component: Component,
  componentProps,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px'
}: {
  component: ComponentType<T>;
  componentProps?: T;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  const defaultPlaceholder = (
    <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div ref={ref}>
      {isIntersecting ? (
        <Component {...(componentProps as T)} />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
}

// Error Boundary para componentes lazy
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Utilitário para pre-carregar componentes críticos
export function preloadCriticalComponents() {
  const criticalComponents = Object.entries(LAZY_LOAD_CONFIG)
    .filter(([, config]) => config.priority === 'high')
    .map(([name, config]) => config.componentPath);

  criticalComponents.forEach(async (componentPath) => {
    try {
      await import(componentPath);
      console.log(`🚀 Preloaded critical component: ${componentPath}`);
    } catch (error) {
      console.warn(`Failed to preload ${componentPath}:`, error);
    }
  });
}

// Prefetch baseado em rota
export function prefetchRouteComponents(routes: string[]) {
  routes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}

// Bundle analyzer para desenvolvimento
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Bundle Analysis:');
    console.log('- Total chunks loaded:', performance.getEntriesByType('navigation').length);
    console.log('- Memory usage:', (performance as any).memory?.usedJSHeapSize || 'N/A');
    console.log('- Cached components:', componentCache.size);
  }
}