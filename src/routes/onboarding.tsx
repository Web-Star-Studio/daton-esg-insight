import { Navigate } from 'react-router-dom';
import { CleanOnboardingMain } from '@/components/onboarding/CleanOnboardingMain';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export function OnboardingRoute() {
  const { shouldShowOnboarding, isLoading, user } = useAuth();
  
  useEffect(() => {
    console.log('🔍 OnboardingRoute: Status check', {
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
    console.log('⚠️ OnboardingRoute: No user - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if onboarding is already complete
  if (!shouldShowOnboarding) {
    console.log('✅ OnboardingRoute: Onboarding complete - redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  console.log('🎯 OnboardingRoute: Showing onboarding flow');
  return <CleanOnboardingMain />;
}