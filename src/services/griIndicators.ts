import { supabase } from "@/integrations/supabase/client";

// Interfaces using Database types
export interface GRIIndicatorMapping {
  id: string;
  company_id: string;
  indicator_id: string;
  source_table: string;
  source_column: string;
  mapping_formula?: string;
  mapping_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GRIIndicatorTarget {
  id?: string;
  company_id?: string;
  indicator_id: string;
  target_year: number;
  target_value?: number;
  target_description?: string;
  baseline_value?: number;
  baseline_year?: number;
  progress_tracking?: any;
  created_at?: string;
  updated_at?: string;
}

export interface GRIIndicatorBenchmark {
  id: string;
  indicator_id: string;
  sector: string;
  region: string;
  benchmark_value?: number;
  benchmark_range_min?: number;
  benchmark_range_max?: number;
  data_source?: string;
  reference_year?: number;
  created_at: string;
}

export interface GRIIndicatorEvidence {
  id?: string;
  company_id?: string;
  indicator_data_id: string;
  document_id?: string;
  evidence_type?: string;
  evidence_description?: string;
  file_path?: string;
  created_at?: string;
}

export interface GRIIndicatorHistory {
  id?: string;
  company_id?: string;
  indicator_data_id: string;
  previous_value?: string;
  new_value?: string;
  change_reason?: string;
  changed_by_user_id?: string;
  created_at?: string;
}

export interface SuggestedValue {
  suggested_value: number;
  unit: string;
  data_source: string;
  confidence: 'high' | 'medium' | 'low';
}

// Helper functions
const getCompanyId = async (): Promise<string> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('company_id')
    .maybeSingle();
  
  if (error) throw new Error(`Erro ao buscar company_id: ${error.message}`);
  if (!profile) throw new Error('Perfil não encontrado');
  return profile.company_id || '';
};

const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || '';
};

export const getIndicatorValue = (indicatorData: any): string | number | null => {
  if (!indicatorData) return null;
  
  if (indicatorData.numeric_value !== null && indicatorData.numeric_value !== undefined) return indicatorData.numeric_value;
  if (indicatorData.percentage_value !== null && indicatorData.percentage_value !== undefined) return indicatorData.percentage_value;
  if (indicatorData.text_value !== null && indicatorData.text_value !== undefined) return indicatorData.text_value;
  if (indicatorData.boolean_value !== null && indicatorData.boolean_value !== undefined) return indicatorData.boolean_value ? 'Sim' : 'Não';
  if (indicatorData.date_value !== null && indicatorData.date_value !== undefined) return indicatorData.date_value;
  
  return null;
};

// Mappings API
export async function getIndicatorMappings(companyId?: string): Promise<GRIIndicatorMapping[]> {
  const { data, error } = await supabase
    .from('gri_indicator_mappings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching indicator mappings:', error);
    throw error;
  }

  return data || [];
}

export async function createIndicatorMapping(mapping: Partial<GRIIndicatorMapping>): Promise<any> {
  const { data, error } = await supabase
    .from('gri_indicator_mappings')
    .insert(mapping as any)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating indicator mapping:', error);
    throw new Error(`Erro ao criar mapeamento de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Não foi possível criar mapeamento de indicador');

  return data;
}

export async function updateIndicatorMapping(id: string, updates: Partial<GRIIndicatorMapping>): Promise<any> {
  const { data, error } = await supabase
    .from('gri_indicator_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating indicator mapping:', error);
    throw new Error(`Erro ao atualizar mapeamento de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Mapeamento de indicador não encontrado');

  return data;
}

export async function deleteIndicatorMapping(id: string): Promise<void> {
  const { error } = await supabase
    .from('gri_indicator_mappings')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting indicator mapping:', error);
    throw error;
  }
}

// Targets API
export async function getIndicatorTargets(indicatorId?: string): Promise<GRIIndicatorTarget[]> {
  let query = supabase
    .from('gri_indicator_targets')
    .select('*')
    .order('target_year', { ascending: false });

  if (indicatorId) {
    query = query.eq('indicator_id', indicatorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching indicator targets:', error);
    throw error;
  }

  return data || [];
}

export async function createIndicatorTarget(target: Partial<GRIIndicatorTarget>): Promise<any> {
  const companyId = await getCompanyId();
  
  const targetData = {
    ...target,
    company_id: target.company_id || companyId,
    indicator_id: target.indicator_id!,
    target_year: target.target_year!,
  };

  const { data, error } = await supabase
    .from('gri_indicator_targets')
    .insert(targetData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating indicator target:', error);
    throw new Error(`Erro ao criar meta de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Não foi possível criar meta de indicador');

  return data;
}

export async function updateIndicatorTarget(id: string, updates: Partial<GRIIndicatorTarget>): Promise<any> {
  const { data, error } = await supabase
    .from('gri_indicator_targets')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating indicator target:', error);
    throw new Error(`Erro ao atualizar meta de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Meta de indicador não encontrada');

  return data;
}

export async function deleteIndicatorTarget(id: string): Promise<void> {
  const { error } = await supabase
    .from('gri_indicator_targets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting indicator target:', error);
    throw error;
  }
}

// Benchmarks API
export async function getIndicatorBenchmarks(indicatorId?: string, sector?: string): Promise<GRIIndicatorBenchmark[]> {
  let query = supabase
    .from('gri_indicator_benchmarks')
    .select('*')
    .order('reference_year', { ascending: false });

  if (indicatorId) {
    query = query.eq('indicator_id', indicatorId);
  }

  if (sector) {
    query = query.eq('sector', sector);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching indicator benchmarks:', error);
    throw error;
  }

  return data || [];
}

// Evidence API
export async function getIndicatorEvidence(indicatorDataId: string): Promise<GRIIndicatorEvidence[]> {
  const { data, error } = await supabase
    .from('gri_indicator_evidence')
    .select('*')
    .eq('indicator_data_id', indicatorDataId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching indicator evidence:', error);
    throw error;
  }

  return data || [];
}

export async function createIndicatorEvidence(evidence: Partial<GRIIndicatorEvidence>): Promise<any> {
  const companyId = await getCompanyId();
  
  const evidenceData = {
    ...evidence,
    company_id: evidence.company_id || companyId,
    indicator_data_id: evidence.indicator_data_id!,
    evidence_type: evidence.evidence_type || 'document',
  };

  const { data, error } = await supabase
    .from('gri_indicator_evidence')
    .insert(evidenceData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating indicator evidence:', error);
    throw new Error(`Erro ao criar evidência de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Não foi possível criar evidência de indicador');

  return data;
}

// History API
export async function getIndicatorHistory(indicatorDataId: string): Promise<GRIIndicatorHistory[]> {
  const { data, error } = await supabase
    .from('gri_indicator_history')
    .select('*')
    .eq('indicator_data_id', indicatorDataId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching indicator history:', error);
    throw error;
  }

  return data || [];
}

export async function createIndicatorHistory(history: Partial<GRIIndicatorHistory>): Promise<any> {
  const companyId = await getCompanyId();
  const userId = await getCurrentUserId();
  
  const historyData = {
    ...history,
    company_id: history.company_id || companyId,
    changed_by_user_id: history.changed_by_user_id || userId,
    indicator_data_id: history.indicator_data_id!,
  };

  const { data, error } = await supabase
    .from('gri_indicator_history')
    .insert(historyData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating indicator history:', error);
    throw new Error(`Erro ao criar histórico de indicador: ${error.message}`);
  }
  if (!data) throw new Error('Não foi possível criar histórico de indicador');

  return data;
}

// Intelligent Suggestions API
export async function getSuggestedValue(indicatorCode: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_indicator_suggested_value', {
      p_company_id: null, // Will use get_user_company_id() in the function
      p_indicator_code: indicatorCode
    });

    if (error) {
      console.error('Error getting suggested value:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error calling suggested value function:', error);
    return null;
  }
}

// Analytics Functions
export async function getIndicatorCompletionStats(): Promise<{
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_percentage: number;
}> {
  try {
    const { data: allIndicators, error: indicatorsError } = await supabase
      .from('gri_indicator_data')
      .select('*, indicator:gri_indicators_library(*)')
      .order('created_at');

    if (indicatorsError) throw indicatorsError;

    const total = allIndicators?.length || 0;
    const completed = allIndicators?.filter(ind => ind.is_complete).length || 0;
    const in_progress = allIndicators?.filter(ind => getIndicatorValue(ind) && !ind.is_complete).length || 0;
    const not_started = total - completed - in_progress;
    const completion_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      in_progress,
      not_started,
      completion_percentage
    };
  } catch (error) {
    console.error('Error getting completion stats:', error);
    return {
      total: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      completion_percentage: 0
    };
  }
}

export async function getIndicatorsByCategory(): Promise<Record<string, any[]>> {
  try {
    const { data, error } = await supabase
      .from('gri_indicator_data')
      .select(`
        *,
        indicator:gri_indicators_library(*)
      `)
      .order('created_at');

    if (error) throw error;

    const categorized = (data || []).reduce((acc, indicator) => {
      const category = indicator.indicator?.indicator_type || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(indicator);
      return acc;
    }, {} as Record<string, any[]>);

    return categorized;
  } catch (error) {
    console.error('Error getting indicators by category:', error);
    return {};
  }
}