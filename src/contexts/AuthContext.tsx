import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService, type AuthUser, type RegisterCompanyData } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔍 Checking onboarding status for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        setShouldShowOnboarding(false);
        return false;
      }

      const hasCompletedOnboarding = profile?.has_completed_onboarding ?? false;
      const shouldShow = !hasCompletedOnboarding;
      
      console.log('📊 Onboarding check result:', {
        userId,
        hasCompletedOnboarding,
        shouldShow
      });
      
      setShouldShowOnboarding(shouldShow);
      return shouldShow;
    } catch (error) {
      console.error('❌ Error in onboarding check:', error);
      setShouldShowOnboarding(false);
      return false;
    }
  };

  const forceShowOnboarding = () => {
    setShouldShowOnboarding(true);
  };

  useEffect(() => {
    let isInitialized = false;
    
    // Configurar listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        // Skip duplicate calls during initialization
        if (event === 'INITIAL_SESSION' && isInitialized) {
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          // Avoid duplicate calls by debouncing
          setTimeout(async () => {
            try {
              const userData = await authService.getCurrentUser();
              if (userData) {
                setUser(userData);
                // Only check onboarding status once per session
                if (!isInitialized) {
                  await checkOnboardingStatus(userData.id);
                }
              } else {
                setUser(null);
              }
            } catch (error) {
              console.error('AuthContext: Erro ao buscar dados do usuário:', error);
              setUser(null);
            } finally {
              setIsLoading(false);
              isInitialized = true;
            }
          }, 100); // Small delay to avoid race conditions
        } else {
          setUser(null);
          setShouldShowOnboarding(false);
          setIsLoading(false);
          isInitialized = true;
        }
      }
    );

    // Verificar sessão inicial apenas uma vez
    if (!isInitialized) {
      console.log('AuthContext: Checking for existing session');
      authService.getCurrentUser().then(async (userData) => {
        if (userData && !isInitialized) {
          console.log('AuthContext: Initial user data found:', userData.full_name);
          setUser(userData);
          await checkOnboardingStatus(userData.id);
        } else if (!isInitialized) {
          setUser(null);
          setShouldShowOnboarding(false);
        }
        
        if (!isInitialized) {
          setIsLoading(false);
          isInitialized = true;
        }
      }).catch((error) => {
        if (!isInitialized) {
          console.error('AuthContext: Error checking initial session:', error);
          setUser(null);
          setShouldShowOnboarding(false);
          setIsLoading(false);
          isInitialized = true;
        }
      });
    }

    return () => subscription.unsubscribe();
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
      // Reset onboarding status in database
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ has_completed_onboarding: false })
          .eq('id', user.id);
      }
      
      // Clear local storage
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_tutorial_completed');
      localStorage.removeItem('daton_primeiros_passos_dismissed');
      
      // Force show onboarding
      forceShowOnboarding();
      
      toast({
        title: "Guia reiniciado",
        description: "O guia de configuração foi reiniciado com sucesso."
      });
      
    } catch (error) {
      console.error('Error restarting onboarding:', error);
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