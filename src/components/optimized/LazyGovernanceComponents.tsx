import React, { memo, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSkeleton } from '@/components/ui/skeleton-loader';
import { LoadingState } from '@/components/ui/loading-state';
import { useLazyComponentLoader } from '@/hooks/useLazyComponent';

// Lazy load heavy components
const IntelligenceHub = React.lazy(() => import('@/components/IntelligenceHub'));
const SystemPerformanceMonitor = React.lazy(() => import('@/components/SystemPerformanceMonitor'));
const AdvancedNotificationPanel = React.lazy(() => import('@/components/AdvancedNotificationPanel'));

// Optimized wrapper component with memoization
interface LazyIntelligenceHubProps {
  className?: string;
}

export const LazyIntelligenceHub = memo(({ className }: LazyIntelligenceHubProps) => {
  const { ref, isVisible } = useLazyComponentLoader(0.1, '100px');

  return (
    <div ref={ref} className={className}>
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

export const LazySystemPerformanceMonitor = memo(() => {
  const { ref, isVisible } = useLazyComponentLoader();

  return (
    <div ref={ref}>
      {isVisible ? (
        <ErrorBoundary>
          <Suspense fallback={<LoadingState loading={true} skeleton={<DashboardSkeleton />}>{null}</LoadingState>}>
            <SystemPerformanceMonitor />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="h-64">
          <DashboardSkeleton />
        </div>
      )}
    </div>
  );
});

LazySystemPerformanceMonitor.displayName = 'LazySystemPerformanceMonitor';

export const LazyAdvancedNotificationPanel = memo(() => {
  const { ref, isVisible } = useLazyComponentLoader();

  return (
    <div ref={ref}>
      {isVisible ? (
        <ErrorBoundary>
          <Suspense fallback={<LoadingState loading={true} skeleton={<DashboardSkeleton />}>{null}</LoadingState>}>
            <AdvancedNotificationPanel />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="h-48">
          <DashboardSkeleton />
        </div>
      )}
    </div>
  );
});

LazyAdvancedNotificationPanel.displayName = 'LazyAdvancedNotificationPanel';