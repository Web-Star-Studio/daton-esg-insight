import { supabase } from "@/integrations/supabase/client";

export interface ESGSolutionProvider {
  id: string;
  company_name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  contact_email: string;
  contact_phone?: string;
  location?: string;
  certifications: string[];
  categories: string[];
  status: string;
  rating: number;
  total_reviews: number;
  verified: boolean;
}

export interface ESGSolution {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  target_problems: string[];
  impact_metrics: any;
  pricing_model: string;
  price_range: string;
  implementation_time: string;
  roi_estimate: string;
  requirements: string[];
  case_studies: any[];
  is_featured: boolean;
  esg_solution_providers: ESGSolutionProvider;
  relevance_score?: number;
  matching_problems?: string[];
}

export interface MarketplaceLead {
  id: string;
  company_id: string;
  user_id: string;
  solution_id: string;
  insight_reference?: string;
  status: string;
  priority: string;
  budget_range?: string;
  timeline?: string;
  specific_requirements?: string;
  contact_notes?: string;
  provider_response?: string;
  estimated_value?: number;
  created_at: string;
}

export interface SolutionReview {
  id: string;
  company_id: string;
  user_id: string;
  solution_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  review_text?: string;
  implementation_success?: boolean;
  roi_achieved?: string;
  would_recommend: boolean;
  verified_purchase: boolean;
  created_at: string;
}

export interface MarketplaceFilters {
  category?: string;
  price_range?: string;
  implementation_time?: string;
  roi_estimate?: string;
  provider_rating?: number;
}

// Buscar soluções baseado em problemas identificados pela IA
export const findMatchingSolutions = async (
  problems: string[], 
  companyContext?: any, 
  filters?: MarketplaceFilters
): Promise<{ solutions: ESGSolution[], total_matches: number, ai_powered: boolean }> => {
  try {
    const { data, error } = await supabase.functions.invoke('marketplace-matcher', {
      body: {
        problems,
        companyContext,
        filters
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error finding matching solutions:', error);
    throw error;
  }
};

// Buscar todas as soluções com filtros
export const getSolutions = async (filters?: MarketplaceFilters): Promise<ESGSolution[]> => {
  try {
    let query = supabase
      .from('esg_solutions')
      .select(`
        *,
        esg_solution_providers!inner(*)
      `)
      .eq('status', 'active')
      .eq('esg_solution_providers.status', 'active')
      .eq('esg_solution_providers.verified', true);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.price_range) {
      query = query.eq('price_range', filters.price_range);
    }
    if (filters?.implementation_time) {
      query = query.eq('implementation_time', filters.implementation_time);
    }
    if (filters?.roi_estimate) {
      query = query.eq('roi_estimate', filters.roi_estimate);
    }
    if (filters?.provider_rating) {
      query = query.gte('esg_solution_providers.rating', filters.provider_rating);
    }

    const { data, error } = await query.order('is_featured', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as ESGSolution[];
  } catch (error) {
    console.error('Error fetching solutions:', error);
    throw error;
  }
};

// Criar um lead (interesse em uma solução)
export const createLead = async (leadData: {
  solution_id: string;
  insight_reference?: string;
  priority?: string;
  budget_range?: string;
  timeline?: string;
  specific_requirements?: string;
}): Promise<MarketplaceLead> => {
  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error('Company ID not found');
    }

    const { data, error } = await supabase
      .from('marketplace_leads')
      .insert({
        ...leadData,
        user_id: userId,
        company_id: profile.company_id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

// Buscar leads da empresa
export const getCompanyLeads = async (): Promise<MarketplaceLead[]> => {
  try {
    const { data, error } = await supabase
      .from('marketplace_leads')
      .select(`
        *,
        esg_solutions(
          title,
          esg_solution_providers(company_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching company leads:', error);
    throw error;
  }
};

// Buscar reviews de uma solução
export const getSolutionReviews = async (solutionId: string): Promise<SolutionReview[]> => {
  try {
    const { data, error } = await supabase
      .from('solution_reviews')
      .select('*')
      .eq('solution_id', solutionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching solution reviews:', error);
    throw error;
  }
};

// Criar review de uma solução
export const createReview = async (reviewData: {
  solution_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  review_text?: string;
  implementation_success?: boolean;
  roi_achieved?: string;
  would_recommend?: boolean;
}): Promise<SolutionReview> => {
  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error('Company ID not found');
    }

    const { data, error } = await supabase
      .from('solution_reviews')
      .insert({
        ...reviewData,
        user_id: userId,
        company_id: profile.company_id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Categorias disponíveis
export const SOLUTION_CATEGORIES = {
  waste_management: {
    label: 'Gestão de Resíduos',
    icon: '♻️',
    color: 'emerald'
  },
  energy_efficiency: {
    label: 'Eficiência Energética', 
    icon: '⚡',
    color: 'yellow'
  },
  carbon_credits: {
    label: 'Créditos de Carbono',
    icon: '🌱',
    color: 'green'
  },
  consulting: {
    label: 'Consultoria ESG',
    icon: '💼',
    color: 'blue'
  }
};

// Faixas de preço
export const PRICE_RANGES = {
  budget_friendly: 'Econômico',
  mid_range: 'Intermediário',
  premium: 'Premium'
};

// Tempos de implementação  
export const IMPLEMENTATION_TIMES = {
  '1-3_months': '1-3 meses',
  '3-6_months': '3-6 meses', 
  '6_months_plus': '6+ meses'
};

// ROI estimates
export const ROI_ESTIMATES = {
  '6-12_months': '6-12 meses',
  '1-2_years': '1-2 anos',
  '2_years_plus': '2+ anos'
};