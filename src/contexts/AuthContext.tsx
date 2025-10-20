import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService, type AuthUser, type RegisterCompanyData } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterCompanyData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  shouldShowOnboarding: boolean;
  skipOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  
  // Check if user has completed onboarding
  const checkOnboardingStatus = async (userId: string) => {
    try {
      logger.debug('Checking onboarding status', 'auth', { userId });
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile for onboarding check', error, 'auth');
        setShouldShowOnboarding(false);
        return false;
      }

      const hasCompletedOnboarding = profile?.has_completed_onboarding ?? false;
      const shouldShow = !hasCompletedOnboarding;
      
      logger.debug('Onboarding status checked', 'auth', {
        userId,
        hasCompletedOnboarding,
        shouldShow
      });
      
      setShouldShowOnboarding(shouldShow);
      return shouldShow;
    } catch (error) {
      logger.error('Error in onboarding check', error, 'auth');
      setShouldShowOnboarding(false);
      return false;
    }
  };

  const forceShowOnboarding = () => {
    setShouldShowOnboarding(true);
  };

  useEffect(() => {
    const isInitializing = useRef(false);
    
    // Prevent duplicate initialization
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    // Setup auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state changed', 'auth', { event });
        
        setSession(session);
        
        if (session?.user) {
          try {
            const userData = await authService.getCurrentUser();
            if (userData) {
              setUser(userData);
              await checkOnboardingStatus(userData.id);
            } else {
              setUser(null);
            }
          } catch (error) {
            logger.error('Error fetching user data on auth change', error, 'auth');
            setUser(null);
          } finally {
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setShouldShowOnboarding(false);
          setIsLoading(false);
        }
      }
    );

    // Check initial session
    authService.getCurrentUser()
      .then(async (userData) => {
        if (userData) {
          logger.info('Initial session found', 'auth', { userName: userData.full_name });
          setUser(userData);
          await checkOnboardingStatus(userData.id);
        } else {
          setUser(null);
          setShouldShowOnboarding(false);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        logger.error('Error checking initial session', error, 'auth');
        setUser(null);
        setShouldShowOnboarding(false);
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
      isInitializing.current = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.loginUser(email, password);
      setUser(response.user);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${response.user?.full_name}!`,
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = "Credenciais inválidas.";
      
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Verifique seu email e clique no link de confirmação antes de fazer login.";
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCompanyData) => {
    try {
      setIsLoading(true);
      const result = await authService.registerCompany(data);
      
      toast({
        title: "Registro realizado com sucesso!",
        description: result.message || "Verifique seu email para ativar a conta.",
      });
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      let errorMessage = "Erro ao criar conta.";
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = "Esta empresa ou email já está cadastrado.";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Email inválido.";
      } else if (error.message?.includes('password')) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout realizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: error.message,
      });
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      if (!userData) {
        toast({
          title: "Atenção",
          description: "Profile de usuário não encontrado. Entre em contato com o suporte.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário. Verifique se seu profile foi criado corretamente.",
        variant: "destructive",
      });
    }
  };

  const restartOnboarding = async () => {
    try {
      console.log('🔄 Restarting onboarding...');
      
      // Reset onboarding status in database
      if (user?.id) {
        console.log('📝 Updating profile to reset onboarding status...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: false })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          throw updateError;
        }
        console.log('✅ Profile updated successfully');
        
        // Also clear any onboarding selections
        console.log('🗑️ Clearing onboarding selections...');
        const { error: deleteError } = await supabase
          .from('onboarding_selections')
          .delete()
          .eq('user_id', user.id);
          
        if (deleteError && deleteError.code !== 'PGRST116') { // Ignore not found error
          console.warn('⚠️ Error clearing onboarding selections:', deleteError);
        }
      }
      
      // Clear all local storage related to onboarding and tutorials
      console.log('🧹 Clearing local storage...');
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_onboarding_selections');
      localStorage.removeItem('daton_onboarding_completed');
      localStorage.removeItem('daton_tutorial_completed');
      localStorage.removeItem('daton_tutorial_progress');
      localStorage.removeItem('daton_user_profile');
      localStorage.removeItem('daton_primeiros_passos_dismissed');
      localStorage.removeItem('unified_tour_progress');
      
      // Force show onboarding immediately
      console.log('✨ Forcing onboarding to show...');
      setShouldShowOnboarding(true);
      
      toast({
        title: "Guia reiniciado! 🎉",
        description: "O guia de configuração foi reiniciado. Recarregando página...",
      });
      
      // Reload page to ensure clean state
      setTimeout(() => {
        console.log('🔄 Reloading page for clean state...');
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error restarting onboarding:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reiniciar o guia de configuração.",
        variant: "destructive"
      });
    }
  };

  const skipOnboarding = async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      setShouldShowOnboarding(false);
      
      toast({
        title: "Onboarding ignorado",
        description: "Você pode acessar o guia de configuração a qualquer momento pelo menu lateral."
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: "Erro",
        description: "Não foi possível pular o onboarding.",
        variant: "destructive"
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    shouldShowOnboarding,
    skipOnboarding,
    restartOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}