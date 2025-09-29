import { supabase } from "@/integrations/supabase/client";

export interface CarbonProject {
  id: string;
  name: string;
  type_methodology: string;
  standard: string;
  location?: string;
  description?: string;
  status: 'Ativo' | 'Suspenso' | 'Encerrado';
  is_public: boolean;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  company_id: string;
  project_id?: string;
  project_name_text?: string;
  standard?: string;
  type_methodology?: string;
  registry_id?: string;
  purchase_date: string;
  quantity_tco2e: number;
  available_quantity: number;
  total_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface CreditRetirement {
  id: string;
  company_id: string;
  credit_purchase_id: string;
  retirement_date: string;
  quantity_tco2e: number;
  reason?: string;
  created_at: string;
}

export interface CreateProjectData {
  name: string;
  type_methodology: string;
  standard: string;
  location?: string;
  description?: string;
  status?: 'Ativo' | 'Suspenso' | 'Encerrado';
  is_public?: boolean;
}

export interface CreatePurchaseData {
  project_id?: string;
  project_name_text?: string;
  standard?: string;
  type_methodology?: string;
  registry_id?: string;
  purchase_date: string;
  quantity_tco2e: number;
  total_cost?: number;
}

export interface CreateRetirementData {
  credit_purchase_id: string;
  retirement_date: string;
  quantity_tco2e: number;
  reason?: string;
}

class CarbonProjectsService {
  // Projects CRUD
  async getProjects(): Promise<CarbonProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('carbon_projects')
      .select('*')
      .or(`company_id.eq.${profile.company_id},is_public.eq.true`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProject(projectId: string): Promise<CarbonProject | null> {
    const { data, error } = await supabase
      .from('carbon_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar projeto: ${error.message}`);
    return data;
  }

  async createProject(projectData: CreateProjectData): Promise<CarbonProject> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('carbon_projects')
      .insert({
        ...projectData,
        company_id: profile.company_id,
        status: projectData.status || 'Ativo',
        is_public: projectData.is_public || false
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar projeto: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar o projeto');
    return data;
  }

  async updateProject(projectId: string, projectData: Partial<CreateProjectData>): Promise<CarbonProject> {
    const { data, error } = await supabase
      .from('carbon_projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar projeto: ${error.message}`);
    if (!data) throw new Error('Projeto não encontrado');
    return data;
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('carbon_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }

  // Credit Purchases CRUD
  async getPurchases(): Promise<CreditPurchase[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPurchase(purchaseId: string): Promise<CreditPurchase | null> {
    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('id', purchaseId)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar compra: ${error.message}`);
    return data;
  }

  async createPurchase(purchaseData: CreatePurchaseData): Promise<CreditPurchase> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('credit_purchases')
      .insert({
        ...purchaseData,
        company_id: profile.company_id,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar compra: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar a compra');
    return data;
  }

  async updatePurchase(purchaseId: string, purchaseData: Partial<CreatePurchaseData>): Promise<CreditPurchase> {
    const { data, error } = await supabase
      .from('credit_purchases')
      .update(purchaseData)
      .eq('id', purchaseId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar compra: ${error.message}`);
    if (!data) throw new Error('Compra não encontrada');
    return data;
  }

  async deletePurchase(purchaseId: string): Promise<void> {
    const { error } = await supabase
      .from('credit_purchases')
      .delete()
      .eq('id', purchaseId);

    if (error) throw error;
  }

  // Credit Retirements CRUD
  async getRetirements(): Promise<CreditRetirement[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('credit_retirements')
      .select(`
        *,
        credit_purchases!inner(
          project_name_text,
          standard,
          type_methodology
        )
      `)
      .eq('company_id', profile.company_id)
      .order('retirement_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createRetirement(retirementData: CreateRetirementData): Promise<CreditRetirement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('credit_retirements')
      .insert({
        ...retirementData,
        company_id: profile.company_id,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar aposentadoria: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar a aposentadoria');
    return data;
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    // Get credit purchases summary
    const { data: purchases } = await supabase
      .from('credit_purchases')
      .select('quantity_tco2e, available_quantity, total_cost')
      .eq('company_id', profile.company_id);

    // Get retirements summary
    const { data: retirements } = await supabase
      .from('credit_retirements')
      .select('quantity_tco2e')
      .eq('company_id', profile.company_id);

    // Get projects count
    const { count: projectsCount } = await supabase
      .from('carbon_projects')
      .select('*', { count: 'exact', head: true })
      .or(`company_id.eq.${profile.company_id},is_public.eq.true`);

    const totalPurchased = purchases?.reduce((sum, p) => sum + p.quantity_tco2e, 0) || 0;
    const totalAvailable = purchases?.reduce((sum, p) => sum + p.available_quantity, 0) || 0;
    const totalRetired = retirements?.reduce((sum, r) => sum + r.quantity_tco2e, 0) || 0;
    const totalInvestment = purchases?.reduce((sum, p) => sum + (p.total_cost || 0), 0) || 0;

    return {
      totalPurchased,
      totalAvailable,
      totalRetired,
      totalInvestment,
      projectsCount: projectsCount || 0,
    };
  }

  // Get available credits for retirement
  async getAvailableCreditsForRetirement(): Promise<CreditPurchase[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('company_id', profile.company_id)
      .gt('available_quantity', 0)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const carbonProjectsService = new CarbonProjectsService();