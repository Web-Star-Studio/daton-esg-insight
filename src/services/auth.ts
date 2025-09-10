import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  role: 'Admin' | 'Editor' | 'Leitor';
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
  role: 'Admin' | 'Editor' | 'Leitor';
}

class AuthService {
  /**
   * Login - equivalente ao POST /auth/login
   */
  async loginUser(email: string, password: string) {
    console.log('Tentando fazer login para:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no login:', error);
      throw new Error(error.message);
    }

    console.log('Login realizado com sucesso');

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
      console.log('Iniciando registro da empresa:', data.company_name);

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
        console.error('Erro ao criar usuário:', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      console.log('Usuário criado com sucesso. Empresa e profile serão criados automaticamente pelo trigger.');

      return { 
        message: "Empresa e usuário criados com sucesso. Verifique seu email para ativar a conta.",
        user: authData.user
      };
    } catch (error: any) {
      console.error('Erro no processo de registro:', error);
      throw error;
    }
  }

  /**
   * Obter usuário atual - equivalente ao GET /users/me
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    console.log('Getting profile for user:', session.user.id);

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
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!profile) {
      console.error('No profile found for user:', session.user.id);
      return null;
    }

    if (!profile.companies) {
      console.error('No company found for profile:', profile.id);
      return null;
    }

    console.log('Profile found successfully:', profile.id);

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: session.user.email!,
      job_title: profile.job_title,
      role: profile.role,
      company: {
        id: profile.companies.id,
        name: profile.companies.name
      }
    };
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