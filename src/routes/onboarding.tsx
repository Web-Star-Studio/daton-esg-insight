import { Navigate } from 'react-router-dom';
import { CleanOnboardingMain } from '@/components/onboarding/CleanOnboardingMain';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingRoute() {
  const { shouldShowOnboarding, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user doesn't need onboarding, redirect to dashboard
  if (!shouldShowOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <CleanOnboardingMain />;
}