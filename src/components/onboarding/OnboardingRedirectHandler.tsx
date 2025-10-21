import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export function OnboardingRedirectHandler() {
  const navigate = useNavigate();
  const { user, skipOnboarding } = useAuth();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user?.id || hasRedirected) return;

      try {
        logger.debug('Checking if user has already completed onboarding', 'ui');
        
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

        logger.debug('Onboarding status check', 'ui', {
          userId: user.id,
          hasCompletedProfile,
          hasCompletedOnboarding,
          currentPath: window.location.pathname
        });

        // If user has completed onboarding, redirect to dashboard
        if (hasCompletedProfile || hasCompletedOnboarding) {
          logger.info('User has completed onboarding, redirecting to dashboard', 'ui');
          
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
        logger.error('Error checking onboarding status', error, 'ui');
      }
    };

    checkAndRedirect();
  }, [user?.id, navigate, skipOnboarding, hasRedirected]);

  return null; // This component doesn't render anything
}