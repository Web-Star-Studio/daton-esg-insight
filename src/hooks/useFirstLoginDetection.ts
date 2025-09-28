import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FirstLoginState {
  isFirstLogin: boolean;
  isLoading: boolean;
  shouldShowOnboarding: boolean;
}

export function useFirstLoginDetection() {
  const { user } = useAuth();
  const [state, setState] = useState<FirstLoginState>({
    isFirstLogin: false,
    isLoading: true,
    shouldShowOnboarding: false
  });

  useEffect(() => {
    if (user?.id) {
      checkFirstLogin();
    } else {
      setState({
        isFirstLogin: false,
        isLoading: false,
        shouldShowOnboarding: false
      });
    }
  }, [user?.id]);

  const checkFirstLogin = async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const hasCompletedOnboarding = profile?.has_completed_onboarding ?? false;
      const isFirstLogin = !hasCompletedOnboarding;

      // Check if there's an existing onboarding session
      let shouldShowOnboarding = false;
      if (isFirstLogin) {
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_selections')
          .select('is_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (onboardingError) {
          console.error('Error fetching onboarding data:', onboardingError);
        }

        // Show onboarding if user hasn't completed it or doesn't have onboarding data
        shouldShowOnboarding = !onboardingData?.is_completed;
      }

      setState({
        isFirstLogin,
        isLoading: false,
        shouldShowOnboarding
      });

    } catch (error) {
      console.error('Error in first login detection:', error);
      setState({
        isFirstLogin: false,
        isLoading: false,
        shouldShowOnboarding: false
      });
    }
  };

  const markOnboardingComplete = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      setState(prev => ({
        ...prev,
        isFirstLogin: false,
        shouldShowOnboarding: false
      }));
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  return {
    ...state,
    markOnboardingComplete,
    refetch: checkFirstLogin
  };
}