import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/supabase-helpers';

interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: UserProfile | null;
  error: Error | null;
}

export function useAuthCheck() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    profile: null,
    error: null
  });
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Erro de sessão: ${sessionError.message}`);
        }

        if (!session || !session.user) {
          setAuthStatus({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            profile: null,
            error: new Error('Usuário não autenticado')
          });
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_id, full_name, role, has_completed_onboarding')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
        }

        if (!profile) {
          throw new Error('Perfil do usuário não encontrado');
        }

        if (!profile.company_id) {
          throw new Error('Usuário não está associado a nenhuma empresa');
        }

        // All checks passed
        setAuthStatus({
          isAuthenticated: true,
          isLoading: false,
          user: session.user,
          profile,
          error: null
        });

      } catch (error) {
        logger.error('Erro na verificação de autenticação', error, 'auth');
        setAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          profile: null,
          error: error as Error
        });
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          profile: null,
          error: new Error('Usuário desconectado')
        });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-check auth when user signs in or token refreshes
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const retry = () => {
    setAuthStatus(prev => ({ ...prev, isLoading: true, error: null }));
    // Re-trigger the auth check
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return {
    ...authStatus,
    retry
  };
}