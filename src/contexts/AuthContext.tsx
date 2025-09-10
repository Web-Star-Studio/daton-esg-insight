import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService, type AuthUser, type RegisterCompanyData } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterCompanyData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configurar listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Buscar dados completos do usuário
          setTimeout(async () => {
            try {
              console.log('AuthContext: Session found, fetching user data');
              const userData = await authService.getCurrentUser();
              if (userData) {
                console.log('AuthContext: User data found:', userData.full_name);
                setUser(userData);
              } else {
                console.log('AuthContext: No user data found for session');
                setUser(null);
              }
            } catch (error) {
              console.error('AuthContext: Erro ao buscar dados do usuário:', error);
              setUser(null);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // ENTÃO verificar se já existe uma sessão
    console.log('AuthContext: Checking for existing session');
    authService.getCurrentUser().then((userData) => {
      if (userData) {
        console.log('AuthContext: Initial user data found:', userData.full_name);
      } else {
        console.log('AuthContext: No initial user data found');
      }
      setUser(userData);
      setIsLoading(false);
    }).catch((error) => {
      console.error('AuthContext: Error checking initial session:', error);
      setUser(null);
      setIsLoading(false);
    });

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
      console.log('Tentando buscar dados do usuário...');
      const userData = await authService.getCurrentUser();
      console.log('Dados do usuário obtidos:', userData);
      setUser(userData);
      
      if (!userData) {
        console.log('Nenhum usuário encontrado ou profile não existe');
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

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
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