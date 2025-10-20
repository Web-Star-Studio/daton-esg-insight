import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FirstLoginState {
  isFirstLogin: boolean;
  isLoading: boolean;
  shouldShowOnboarding: boolean;
}

/**
 * Hook consolidado para detecção de primeiro login
 * Sincronizado com AuthContext para evitar duplicação de lógica
 */
export function useFirstLoginDetection() {
  const { user, shouldShowOnboarding: authShouldShowOnboarding } = useAuth();
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
  }, [user?.id, authShouldShowOnboarding]);

  const checkFirstLogin = useCallback(async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Sync with AuthContext state first
      if (authShouldShowOnboarding !== undefined) {
        setState({
          isFirstLogin: authShouldShowOnboarding,
          isLoading: false,
          shouldShowOnboarding: authShouldShowOnboarding
        });
        return;
      }

      // Fallback: Check database directly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ useFirstLoginDetection: Error fetching profile:', profileError);
        setState({ isFirstLogin: false, isLoading: false, shouldShowOnboarding: false });
        return;
      }

      const hasCompletedOnboarding = profile?.has_completed_onboarding ?? false;
      const isFirstLogin = !hasCompletedOnboarding;

      // Check onboarding progress
      let shouldShowOnboarding = false;
      if (isFirstLogin) {
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_selections')
          .select('is_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error('⚠️ useFirstLoginDetection: Error fetching onboarding data:', onboardingError);
        }

        shouldShowOnboarding = !onboardingData?.is_completed;
      }

      console.log('✅ useFirstLoginDetection: Check complete', {
        userId: user.id,
        isFirstLogin,
        shouldShowOnboarding
      });

      setState({
        isFirstLogin,
        isLoading: false,
        shouldShowOnboarding
      });

    } catch (error) {
      console.error('❌ useFirstLoginDetection: Unexpected error:', error);
      setState({
        isFirstLogin: false,
        isLoading: false,
        shouldShowOnboarding: false
      });
    }
  }, [user?.id, authShouldShowOnboarding]);

  const markOnboardingComplete = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ useFirstLoginDetection: Cannot mark complete - no user');
      return false;
    }

    try {
      console.log('📝 useFirstLoginDetection: Marking onboarding complete...');
      
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (error) {
        console.error('❌ useFirstLoginDetection: Error marking complete:', error);
        throw error;
      }

      setState(prev => ({
        ...prev,
        isFirstLogin: false,
        shouldShowOnboarding: false
      }));

      console.log('✅ useFirstLoginDetection: Onboarding marked complete');
      return true;
    } catch (error) {
      console.error('❌ useFirstLoginDetection: Error in markOnboardingComplete:', error);
      return false;
    }
  }, [user?.id]);

  return {
    ...state,
    markOnboardingComplete,
    refetch: checkFirstLogin
  };
}