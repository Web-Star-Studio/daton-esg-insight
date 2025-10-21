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
        logger.debug('No active session found', 'auth');
        return null;
      }

      logger.info('Getting profile for user', 'auth', { userId: session.user.id });

      // Fetch profile WITHOUT joining companies to avoid RLS issues
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching profile', error, 'database');
        throw new Error(`Erro ao buscar perfil: ${error.message}`);
      }

      // TOLERANT APPROACH: If profile doesn't exist, return basic user with viewer role
      if (!profile) {
        logger.warn('No profile found - creating fallback user', 'database', { userId: session.user.id });
        return {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email!,
          job_title: undefined,
          role: 'viewer' as const,
          company: {
            id: session.user.user_metadata?.company_id || '',
            name: session.user.user_metadata?.company_name || 'Empresa não configurada'
          }
        };
      }

      // Fetch company separately with error tolerance
      let company = null;
      if (profile.company_id) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', profile.company_id)
            .maybeSingle();
          
          company = companyData;
          
          if (!companyData) {
            logger.warn('Company not found for profile', 'database', { companyId: profile.company_id });
          }
        } catch (companyError) {
          logger.warn('Error fetching company - using fallback', companyError, 'database');
        }
      }

      // SECURE: Fetch role from user_roles table (CRITICAL SECURITY FIX)
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        logger.error('Error fetching user role', roleError, 'database');
        throw new Error(`Erro ao buscar permissões: ${roleError.message}`);
      }

      // Get role from user_roles - DO NOT auto-migrate as it requires admin privileges
      let finalRole = userRole?.role;
      
      // TOLERANT APPROACH: If no role found, default to viewer
      if (!finalRole) {
        logger.warn('No role found for user - defaulting to viewer', 'database', { 
          userId: session.user.id,
          profileRole: profile.role 
        });
        finalRole = 'viewer';
      }

      logger.info('Profile found successfully', 'auth', { 
        profileId: profile.id,
        role: finalRole,
        companyId: profile.company_id,
        hasCompanyData: !!company
      });

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: session.user.email!,
        job_title: profile.job_title,
        role: finalRole,
        company: {
          id: company?.id || profile.company_id || '',
          name: company?.name || 'Empresa não configurada'
        }
      };
    } catch (error) {
      logger.error('Error in getCurrentUser', error, 'auth');
      throw error;
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