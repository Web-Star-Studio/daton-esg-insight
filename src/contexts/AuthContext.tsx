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
  
  // CRITICAL: useRef MUST be at component level, not inside useEffect
  const isInitializingRef = useRef(false);
  
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
    // Prevent duplicate initialization
    if (isInitializingRef.current) {
      logger.debug('Auth initialization already in progress, skipping', 'auth');
      return;
    }
    isInitializingRef.current = true;
    
    logger.info('Initializing auth context', 'auth');
    
    // Safety timeout to ensure loading state is cleared
    const safetyTimeout = setTimeout(() => {
      logger.warn('Auth initialization timeout - forcing loading state to false', 'auth');
      setIsLoading(false);
    }, 5000); // 5 second timeout
    
    // Setup auth state listener with SYNCHRONOUS callback to prevent deadlock
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed', 'auth', { event, hasSession: !!session });
        
        // Only synchronous updates in the callback
        setSession(session);
        
        if (session?.user) {
          // Defer async operations to prevent blocking
          setTimeout(() => {
            logger.info('Fetching user data after auth change', 'auth');
            authService.getCurrentUser()
              .then(user => {
                logger.info('User data fetched successfully', 'auth', { userId: user?.id });
                setUser(user);
                if (user) {
                  return checkOnboardingStatus(user.id);
                }
              })
              .catch(error => {
                logger.error('Error fetching user data', error, 'auth');
                setUser(null);
              })
              .finally(() => {
                setIsLoading(false);
              });
          }, 0);
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
          logger.info('No initial session found', 'auth');
          setUser(null);
          setShouldShowOnboarding(false);
        }
      })
      .catch((error) => {
        logger.error('Error checking initial session', error, 'auth');
        setUser(null);
        setShouldShowOnboarding(false);
      })
      .finally(() => {
        logger.info('Auth initialization complete', 'auth');
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      isInitializingRef.current = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      logger.info('Starting login process', 'auth', { email });
      
      const response = await authService.loginUser(email, password);
      
      if (!response.user) {
        logger.error('Login succeeded but user data not found', null, 'auth', { email });
        throw new Error('Seu perfil não foi encontrado. Entre em contato com o suporte.');
      }
      
      logger.info('Login successful, setting user data', 'auth', { 
        userId: response.user.id,
        userName: response.user.full_name 
      });
      
      setUser(response.user);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${response.user?.full_name}!`,
      });
    } catch (error: any) {
      logger.error('Login failed', error, 'auth', { email });
      
      let errorMessage = "Credenciais inválidas.";
      
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Verifique seu email e clique no link de confirmação antes de fazer login.";
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes('perfil não foi encontrado') || error.message?.includes('profile')) {
        errorMessage = "Seu perfil não está configurado corretamente. Entre em contato com o suporte.";
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
      logger.error('Registration failed', error, 'auth', { companyName: data.company_name });
      
      let errorMessage = "Erro ao criar conta.";
      let errorTitle = "Erro no registro";
      
      // Tratamento especial para usuário já registrado (convite)
      if (error.message?.includes('already been registered') || 
          error.message?.includes('already registered') ||
          error.message?.includes('User already registered')) {
        errorTitle = "Email já cadastrado";
        errorMessage = "Este email já está registrado. Se você recebeu um convite, verifique seu email e clique no link para definir sua senha. Ou tente fazer login.";
      } else if (error.message?.includes('duplicate key')) {
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
        title: errorTitle,
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
      logger.error('Failed to refresh user', error, 'auth');
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário. Verifique se seu profile foi criado corretamente.",
        variant: "destructive",
      });
    }
  };

  const restartOnboarding = async () => {
    try {
      logger.info('Restarting onboarding', 'onboarding', { userId: user?.id });
      
      // Reset onboarding status in database
      if (user?.id) {
        logger.debug('Updating profile to reset onboarding status', 'onboarding');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: false })
          .eq('id', user.id);
          
        if (updateError) {
          logger.error('Failed to update profile', updateError, 'onboarding');
          throw updateError;
        }
        logger.debug('Profile updated successfully', 'onboarding');
        
        // Also clear any onboarding selections
        logger.debug('Clearing onboarding selections', 'onboarding');
        const { error: deleteError } = await supabase
          .from('onboarding_selections')
          .delete()
          .eq('user_id', user.id);
          
        if (deleteError && deleteError.code !== 'PGRST116') { // Ignore not found error
          logger.warn('Failed to clear onboarding selections', deleteError, 'onboarding');
        }
      }
      
      // Clear all local storage related to onboarding and tutorials
      logger.debug('Clearing local storage', 'onboarding');
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_onboarding_selections');
      localStorage.removeItem('daton_onboarding_completed');
      localStorage.removeItem('daton_tutorial_completed');
      localStorage.removeItem('daton_tutorial_progress');
      localStorage.removeItem('daton_user_profile');
      localStorage.removeItem('daton_primeiros_passos_dismissed');
      localStorage.removeItem('unified_tour_progress');
      
      // Force show onboarding immediately
      logger.debug('Forcing onboarding to show', 'onboarding');
      setShouldShowOnboarding(true);
      
      toast({
        title: "Guia reiniciado! 🎉",
        description: "O guia de configuração foi reiniciado. Recarregando página...",
      });
      
      // Reload page to ensure clean state
      setTimeout(() => {
        logger.debug('Reloading page for clean state', 'onboarding');
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      logger.error('Failed to restart onboarding', error, 'onboarding');
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
      logger.error('Failed to skip onboarding', error, 'onboarding');
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