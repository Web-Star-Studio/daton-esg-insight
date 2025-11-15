import { supabase } from '@/integrations/supabase/client';

export interface ESGFinancialStats {
  year: number;
  environmental_costs: number;
  social_costs: number;
  governance_costs: number;
  total_esg_costs: number;
  total_expenses: number;
  esg_percentage: number;
  total_carbon_impact: number;
  breakdown: {
    Environmental: number;
    Social: number;
    Governance: number;
  };
}

export interface ESGFinancialLink {
  id: string;
  company_id: string;
  financial_entity_type: 'accounts_payable' | 'accounts_receivable' | 'accounting_entry';
  financial_entity_id: string;
  esg_category: 'Environmental' | 'Social' | 'Governance';
  esg_pillar?: string;
  related_project_type?: string;
  related_project_id?: string;
  carbon_impact_estimate?: number;
  social_impact_description?: string;
  allocation_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ESGROIResult {
  projectId: string;
  projectType: string;
  totalInvestment: number;
  estimatedBenefits: number;
  roi: number;
  carbonImpact: number;
  socialImpact: string;
  breakdown: {
    directCosts: number;
    indirectCosts: number;
    financialBenefits: number;
    nonFinancialBenefits: number;
  };
  transactions: Array<{
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

export const esgFinancialService = {
  // Buscar estatísticas ESG financeiras
  async getESGFinancialStats(year?: number): Promise<ESGFinancialStats> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase.rpc('get_esg_financial_stats', {
      p_company_id: profile.company_id,
      p_year: year || new Date().getFullYear()
    });

    if (error) throw error;
    return data as unknown as ESGFinancialStats;
  },

  // Buscar vínculos financeiros-ESG
  async getESGFinancialLinks(filters?: {
    entityType?: string;
    entityId?: string;
    category?: string;
    projectId?: string;
  }): Promise<ESGFinancialLink[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('esg_financial_links')
      .select('*')
      .eq('company_id', profile.company_id);

    if (filters?.entityType) {
      query = query.eq('financial_entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('financial_entity_id', filters.entityId);
    }
    if (filters?.category) {
      query = query.eq('esg_category', filters.category);
    }
    if (filters?.projectId) {
      query = query.eq('related_project_id', filters.projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ESGFinancialLink[]) || [];
  },

  // Criar vínculo financeiro-ESG
  async createESGFinancialLink(link: Omit<ESGFinancialLink, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<ESGFinancialLink> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('esg_financial_links')
      .insert({
        ...link,
        company_id: profile.company_id,
        created_by_user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as ESGFinancialLink;
  },

  // Atualizar vínculo financeiro-ESG
  async updateESGFinancialLink(id: string, updates: Partial<ESGFinancialLink>): Promise<ESGFinancialLink> {
    const { data, error } = await supabase
      .from('esg_financial_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ESGFinancialLink;
  },

  // Deletar vínculo financeiro-ESG
  async deleteESGFinancialLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('esg_financial_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calcular ROI de projeto ESG
  async calculateESGROI(
    projectType: 'goal' | 'social_project' | 'conservation_activity' | 'training_program',
    projectId: string,
    year?: number
  ): Promise<ESGROIResult> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase.functions.invoke('calculate-esg-roi', {
      body: {
        companyId: profile.company_id,
        projectType,
        projectId,
        year: year || new Date().getFullYear()
      }
    });

    if (error) throw error;
    return data;
  },

  // Buscar resumo da view agregada
  async getESGSummary(year?: number) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const targetYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('v_esg_financial_summary')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('year', targetYear);

    if (error) throw error;
    return data || [];
  },

  // Atualizar campos ESG em contas a pagar
  async updatePayableESGFields(
    payableId: string, 
    esgData: {
      esg_category?: string;
      esg_related_project_id?: string;
      carbon_impact_estimate?: number;
    }
  ) {
    const { error } = await supabase
      .from('accounts_payable')
      .update(esgData)
      .eq('id', payableId);

    if (error) throw error;
  },

  // Atualizar campos ESG em contas a receber
  async updateReceivableESGFields(
    receivableId: string,
    esgData: {
      esg_category?: string;
      esg_related_project_id?: string;
      carbon_impact_estimate?: number;
    }
  ) {
    const { error } = await supabase
      .from('accounts_receivable')
      .update(esgData)
      .eq('id', receivableId);

    if (error) throw error;
  }
};
