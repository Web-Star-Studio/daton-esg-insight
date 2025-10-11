import React, { memo, Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSkeleton } from '@/components/ui/skeleton-loader';
import { useLazyComponentLoader } from '@/hooks/useLazyComponent';

// Lazy load dashboard components - all use default exports
const IntelligenceHub = lazy(() => import('@/components/IntelligenceHub'));
const GlobalIntelligentSearch = lazy(() => import('@/components/GlobalIntelligentSearch').then(m => ({ default: m.GlobalIntelligentSearch })));
const StakeholderAnalyticsDashboard = lazy(() => import('@/components/StakeholderAnalyticsDashboard'));
const SystemPerformanceMonitor = lazy(() => import('@/components/SystemPerformanceMonitor').then(m => ({ default: m.SystemPerformanceMonitor || m.default })));

// Lazy Intelligence Hub
export const LazyIntelligenceHub = memo(() => {
  const { ref, isVisible } = useLazyComponentLoader(0.1, '100px');

  return (
    <div ref={ref}>
      {isVisible ? (
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <IntelligenceHub />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="h-96">
          <DashboardSkeleton />
        </div>
      )}
    </div>
  );
});

LazyIntelligenceHub.displayName = 'LazyIntelligenceHub';

// Lazy Global Search
export const LazyGlobalSearch = memo(() => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded-md" />}>
        <GlobalIntelligentSearch />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyGlobalSearch.displayName = 'LazyGlobalSearch';

// Lazy Stakeholder Analytics
export const LazyStakeholderAnalytics = memo(() => {
  const { ref, isVisible } = useLazyComponentLoader();

  return (
    <div ref={ref}>
      {isVisible ? (
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <StakeholderAnalyticsDashboard />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="h-96">
          <DashboardSkeleton />
        </div>
      )}
    </div>
  );
});

LazyStakeholderAnalytics.displayName = 'LazyStakeholderAnalytics';

// Lazy Performance Monitor
export const LazyPerformanceMonitor = memo(() => {
  const { ref, isVisible } = useLazyComponentLoader();

  return (
    <div ref={ref}>
      {isVisible ? (
        <ErrorBoundary>
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-md" />}>
            <SystemPerformanceMonitor />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="h-64 bg-muted animate-pulse rounded-md" />
      )}
    </div>
  );
});

LazyPerformanceMonitor.displayName = 'LazyPerformanceMonitor';
