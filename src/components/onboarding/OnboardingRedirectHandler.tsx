import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function OnboardingRedirectHandler() {
  const navigate = useNavigate();
  const { user, skipOnboarding } = useAuth();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user?.id || hasRedirected) return;

      try {
        console.log('🔍 Checking if user has already completed onboarding...');
        
        // Check both profile and onboarding_selections tables
        const [profileCheck, onboardingCheck] = await Promise.all([
          supabase
            .from('profiles')
            .select('has_completed_onboarding')
            .eq('id', user.id)
            .single(),
          supabase
            .from('onboarding_selections')
            .select('is_completed')
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .single()
        ]);

        const hasCompletedProfile = profileCheck.data?.has_completed_onboarding ?? false;
        const hasCompletedOnboarding = !!onboardingCheck.data;

        console.log('📊 Onboarding status check:', {
          userId: user.id,
          hasCompletedProfile,
          hasCompletedOnboarding,
          currentPath: window.location.pathname
        });

        // If user has completed onboarding, redirect to dashboard
        if (hasCompletedProfile || hasCompletedOnboarding) {
          console.log('✅ User has completed onboarding, redirecting to dashboard...');
          
          // Mark as redirected to prevent loops
          setHasRedirected(true);
          
          // Ensure auth context is updated
          await skipOnboarding();
          
          // Only redirect if currently on onboarding route
          if (window.location.pathname.includes('onboarding') || 
              window.location.pathname.includes('gestao-esg')) {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
      }
    };

    checkAndRedirect();
  }, [user?.id, navigate, skipOnboarding, hasRedirected]);

  return null; // This component doesn't render anything
}