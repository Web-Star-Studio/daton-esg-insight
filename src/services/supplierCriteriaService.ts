import { supabase } from "@/integrations/supabase/client";

// Interfaces
export interface SupplierEvaluationCriteria {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  weight: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierEvaluationConfig {
  id: string;
  company_id: string;
  minimum_approval_points: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierCriteriaEvaluation {
  id: string;
  company_id: string;
  supplier_id: string;
  evaluation_date: string;
  total_weight: number;
  achieved_weight: number;
  minimum_required?: number;
  is_approved: boolean;
  observation?: string;
  evaluated_by?: string;
  created_at: string;
}

export interface SupplierCriteriaEvaluationItem {
  id: string;
  evaluation_id: string;
  criteria_id?: string;
  criteria_name: string;
  weight: number;
  status: 'ATENDE' | 'NAO_ATENDE';
  created_at: string;
}

// Helper
async function getCurrentUserCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (error || !profile?.company_id) {
    throw new Error("Empresa não encontrada para o usuário");
  }
  
  return profile.company_id;
}

// ==================== CRITÉRIOS ====================

export async function getEvaluationCriteria(): Promise<SupplierEvaluationCriteria[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_evaluation_criteria')
    .select('*')
    .eq('company_id', companyId)
    .order('display_order');
    
  if (error) throw error;
  return (data || []) as SupplierEvaluationCriteria[];
}

export async function getActiveEvaluationCriteria(): Promise<SupplierEvaluationCriteria[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_evaluation_criteria')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('display_order');
    
  if (error) throw error;
  return (data || []) as SupplierEvaluationCriteria[];
}

export async function createEvaluationCriteria(criteria: {
  name: string;
  description?: string;
  weight: number;
  display_order?: number;
}): Promise<SupplierEvaluationCriteria> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_evaluation_criteria')
    .insert({ ...criteria, company_id: companyId })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierEvaluationCriteria;
}

export async function updateEvaluationCriteria(
  id: string, 
  updates: Partial<Omit<SupplierEvaluationCriteria, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
): Promise<SupplierEvaluationCriteria> {
  const { data, error } = await supabase
    .from('supplier_evaluation_criteria')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierEvaluationCriteria;
}

export async function deleteEvaluationCriteria(id: string): Promise<void> {
  const { error } = await supabase
    .from('supplier_evaluation_criteria')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ==================== CONFIGURAÇÃO ====================

export async function getEvaluationConfig(): Promise<SupplierEvaluationConfig | null> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_evaluation_config')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
    
  if (error) throw error;
  return data as SupplierEvaluationConfig | null;
}

export async function upsertEvaluationConfig(config: {
  minimum_approval_points: number;
}): Promise<SupplierEvaluationConfig> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_evaluation_config')
    .upsert({ ...config, company_id: companyId }, { onConflict: 'company_id' })
    .select()
    .single();
    
  if (error) throw error;
  return data as SupplierEvaluationConfig;
}

// ==================== AVALIAÇÕES [AVA2] ====================

export async function getCriteriaEvaluations(supplierId: string): Promise<SupplierCriteriaEvaluation[]> {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('supplier_criteria_evaluations')
    .select('*')
    .eq('company_id', companyId)
    .eq('supplier_id', supplierId)
    .order('evaluation_date', { ascending: false });
    
  if (error) throw error;
  return (data || []) as SupplierCriteriaEvaluation[];
}

export async function getCriteriaEvaluationItems(evaluationId: string): Promise<SupplierCriteriaEvaluationItem[]> {
  const { data, error } = await supabase
    .from('supplier_criteria_evaluation_items')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('created_at');
    
  if (error) throw error;
  return (data || []) as SupplierCriteriaEvaluationItem[];
}

export async function createCriteriaEvaluation(evaluation: {
  supplier_id: string;
  total_weight: number;
  achieved_weight: number;
  minimum_required?: number;
  is_approved: boolean;
  observation?: string;
  items: Array<{
    criteria_id?: string;
    criteria_name: string;
    weight: number;
    status: 'ATENDE' | 'NAO_ATENDE';
  }>;
}): Promise<SupplierCriteriaEvaluation> {
  const companyId = await getCurrentUserCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { items, ...evalData } = evaluation;
  
  // Create evaluation
  const { data: evalResult, error: evalError } = await supabase
    .from('supplier_criteria_evaluations')
    .insert({ 
      ...evalData, 
      company_id: companyId, 
      evaluated_by: user?.id 
    })
    .select()
    .single();
    
  if (evalError) throw evalError;
  
  // Create items
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      ...item,
      evaluation_id: evalResult.id
    }));
    
    const { error: itemsError } = await supabase
      .from('supplier_criteria_evaluation_items')
      .insert(itemsToInsert);
      
    if (itemsError) throw itemsError;
  }
  
  return evalResult as SupplierCriteriaEvaluation;
}

// ==================== CRITÉRIOS PADRÃO ====================

export const DEFAULT_CRITERIA = [
  { name: 'Qualidade do produto/serviço', weight: 1, display_order: 1 },
  { name: 'Prazo de entrega', weight: 2, display_order: 2 },
  { name: 'Conformidade com requisitos', weight: 4, display_order: 3 },
  { name: 'Comunicação/Atendimento', weight: 4, display_order: 4 },
  { name: 'Preço competitivo', weight: 1, display_order: 5 },
  { name: 'Documentação em dia', weight: 5, display_order: 6 },
];

export async function initializeDefaultCriteria(): Promise<void> {
  const companyId = await getCurrentUserCompanyId();
  
  // Check if criteria already exist
  const { data: existing } = await supabase
    .from('supplier_evaluation_criteria')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);
    
  if (existing && existing.length > 0) return;
  
  // Create default criteria
  const criteriaToInsert = DEFAULT_CRITERIA.map(c => ({
    ...c,
    company_id: companyId
  }));
  
  await supabase
    .from('supplier_evaluation_criteria')
    .insert(criteriaToInsert);
}
