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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

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
      // 1. Criar a empresa primeiro
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.company_name,
          cnpj: data.cnpj
        })
        .select()
        .single();

      if (companyError) {
        throw new Error(companyError.message);
      }

      // 2. Registrar o usuário
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.user_name,
            company_id: companyData.id
          }
        }
      });

      if (authError) {
        // Reverter criação da empresa se o usuário não foi criado
        await supabase.from('companies').delete().eq('id', companyData.id);
        throw new Error(authError.message);
      }

      // 3. Criar perfil do usuário
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: data.user_name,
            company_id: companyData.id,
            role: 'Admin' // Primeiro usuário da empresa é sempre Admin
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
      }

      return { message: "Empresa e usuário criados com sucesso." };
    } catch (error) {
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
      .single();

    if (error || !profile) {
      return null;
    }

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