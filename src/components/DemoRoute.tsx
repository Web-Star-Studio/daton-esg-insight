import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface DemoRouteProps {
  children: React.ReactNode;
}

export function DemoRoute({ children }: DemoRouteProps) {
  const { user, isLoading, isApproved } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Already approved → go to main dashboard
  if (isApproved) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but not approved → show demo
  return <>{children}</>;
}
