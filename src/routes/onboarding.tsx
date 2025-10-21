import { Navigate } from 'react-router-dom';
import { CleanOnboardingMain } from '@/components/onboarding/CleanOnboardingMain';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export function OnboardingRoute() {
  const { shouldShowOnboarding, isLoading, user } = useAuth();
  
  useEffect(() => {
    logger.debug('OnboardingRoute status check', 'ui', {
      shouldShowOnboarding,
      isLoading,
      hasUser: !!user
    });
  }, [shouldShowOnboarding, isLoading, user]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando configuração...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if user is not logged in
  if (!user) {
    logger.warn('OnboardingRoute: No user - redirecting to login', 'auth');
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if onboarding is already complete
  if (!shouldShowOnboarding) {
    logger.info('OnboardingRoute: Onboarding complete - redirecting to dashboard', 'ui');
    return <Navigate to="/" replace />;
  }

  logger.info('OnboardingRoute: Showing onboarding flow', 'ui');
  return <CleanOnboardingMain />;
}