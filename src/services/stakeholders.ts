import { supabase } from "@/integrations/supabase/client";

export interface Stakeholder {
  id: string;
  company_id: string;
  name: string;
  category: 'investors' | 'employees' | 'customers' | 'community' | 'suppliers' | 'regulators' | 'ngos' | 'media';
  subcategory?: string;
  contact_email?: string;
  contact_phone?: string;
  organization?: string;
  position?: string;
  influence_level: 'low' | 'medium' | 'high';
  interest_level: 'low' | 'medium' | 'high';
  engagement_frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  preferred_communication: 'email' | 'phone' | 'meeting' | 'survey';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getStakeholders = async (companyId?: string) => {
  const query = supabase
    .from('stakeholders')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (companyId) {
    query.eq('company_id', companyId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as Stakeholder[];
};

export const getStakeholdersByCategory = async (category: string, companyId?: string) => {
  const query = supabase
    .from('stakeholders')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');
  
  if (companyId) {
    query.eq('company_id', companyId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as Stakeholder[];
};

export const createStakeholder = async (stakeholder: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
  const { data, error } = await supabase
    .from('stakeholders')
    .insert(stakeholder as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as Stakeholder;
};

export const updateStakeholder = async (id: string, updates: Partial<Stakeholder>) => {
  const { data, error } = await supabase
    .from('stakeholders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Stakeholder;
};

export const deleteStakeholder = async (id: string) => {
  const { error } = await supabase
    .from('stakeholders')
    .update({ is_active: false })
    .eq('id', id);
  
  if (error) throw error;
};

export const getStakeholderEngagementStats = async (companyId?: string) => {
  const stakeholders = await getStakeholders(companyId);
  
  const stats = {
    total: stakeholders.length,
    byCategory: {} as Record<string, number>,
    byInfluence: {} as Record<string, number>,
    byEngagementFrequency: {} as Record<string, number>,
    highInfluenceHighInterest: 0,
  };
  
  stakeholders.forEach(stakeholder => {
    // Por categoria
    stats.byCategory[stakeholder.category] = (stats.byCategory[stakeholder.category] || 0) + 1;
    
    // Por nível de influência
    stats.byInfluence[stakeholder.influence_level] = (stats.byInfluence[stakeholder.influence_level] || 0) + 1;
    
    // Por frequência de engajamento
    stats.byEngagementFrequency[stakeholder.engagement_frequency] = (stats.byEngagementFrequency[stakeholder.engagement_frequency] || 0) + 1;
    
    // Stakeholders críticos (alta influência e alto interesse)
    if (stakeholder.influence_level === 'high' && stakeholder.interest_level === 'high') {
      stats.highInfluenceHighInterest++;
    }
  });
  
  return stats;
};

export const STAKEHOLDER_CATEGORIES = [
  { value: 'investors', label: 'Investidores', description: 'Acionistas, fundos de investimento e analistas' },
  { value: 'employees', label: 'Colaboradores', description: 'Funcionários, sindicatos e representantes' },
  { value: 'customers', label: 'Clientes', description: 'Consumidores finais e clientes corporativos' },
  { value: 'community', label: 'Comunidade', description: 'Comunidades locais e lideranças' },
  { value: 'suppliers', label: 'Fornecedores', description: 'Parceiros comerciais e prestadores de serviço' },
  { value: 'regulators', label: 'Reguladores', description: 'Órgãos governamentais e regulatórios' },
  { value: 'ngos', label: 'ONGs', description: 'Organizações não governamentais e terceiro setor' },
  { value: 'media', label: 'Mídia', description: 'Imprensa, influenciadores e formadores de opinião' },
] as const;