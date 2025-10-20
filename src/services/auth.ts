import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'analyst' | 'operator' | 'viewer' | 'auditor';
  company: {
    id: string;
    name: string;
  };
}

export interface RegisterCompanyData {
  company_name: string;
  cnpj: string;
  user_name: string;
  email: string;
  password: string;
}

export interface InviteUserData {
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'analyst' | 'operator' | 'viewer' | 'auditor';
}

class AuthService {
  /**
   * Login - equivalente ao POST /auth/login
   */
  async loginUser(email: string, password: string) {
    logger.info('Login attempt', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Login error', error);
      throw new Error(error.message);
    }

    logger.info('Login successful');

    // Buscar dados completos do usuário após login
    const user = await this.getCurrentUser();
    
    return {
      token: data.session?.access_token,
      user
    };
  }

  /**
   * Registro - equivalente ao POST /auth/register
   */
  async registerCompany(data: RegisterCompanyData) {
    try {
      logger.info('Starting company registration', { company: data.company_name });

      // Criar usuário primeiro com dados da empresa nos metadados
      // O trigger handle_new_user() criará empresa e profile automaticamente
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.user_name,
            company_name: data.company_name,
            cnpj: data.cnpj
          }
        }
      });

      if (authError) {
        logger.error('User creation error', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      logger.info('User created successfully - trigger will create company and profile');

      return { 
        message: "Empresa e usuário criados com sucesso. Verifique seu email para ativar a conta.",
        user: authData.user
      };
    } catch (error: any) {
      logger.error('Registration error', error);
      throw error;
    }
  }

  /**
   * Obter usuário atual - equivalente ao GET /users/me
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      logger.info('Getting profile for user', { userId: session.user.id });

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching profile', error);
        return null;
      }

      if (!profile) {
        logger.error('No profile found for user', { userId: session.user.id });
        return null;
      }

      if (!profile.companies) {
        logger.error('No company found for profile', { profileId: profile.id });
        return null;
      }

      // SECURE: Fetch role from user_roles table (CRITICAL SECURITY FIX)
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        logger.error('Error fetching user role', roleError);
        return null;
      }

      if (!userRole) {
        logger.error('No role found for user', { userId: session.user.id });
        return null;
      }

      logger.info('Profile found successfully', { profileId: profile.id });

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: session.user.email!,
        job_title: profile.job_title,
        role: userRole.role,
        company: {
          id: profile.companies.id,
          name: profile.companies.name
        }
      };
    } catch (error) {
      logger.error('Error in getCurrentUser', error);
      return null;
    }
  }

  /**
   * Listar usuários da empresa - equivalente ao GET /users
   */
  async getCompanyUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        job_title
      `);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(user => ({
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      job_title: user.job_title
    }));
  }

  /**
   * Convidar usuário - equivalente ao POST /users/invite
   */
  async inviteUser(inviteData: InviteUserData) {
    // Esta funcionalidade requereria edge functions para envio de email
    // Por enquanto, retornamos uma resposta simulada
    return {
      message: `Convite enviado para ${inviteData.email}.`
    };
  }

  /**
   * Logout
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Observer de mudanças de autenticação
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();