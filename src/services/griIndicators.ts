import { supabase } from "@/integrations/supabase/client";

export interface GRIIndicatorMapping {
  id: string;
  company_id: string;
  indicator_id: string;
  source_table: string;
  source_column: string;
  mapping_formula?: string;
  mapping_type: 'direct' | 'calculated' | 'aggregated';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GRIIndicatorTarget {
  id: string;
  company_id: string;
  indicator_id: string;
  target_year: number;
  target_value?: number;
  target_description?: string;
  baseline_value?: number;
  baseline_year?: number;
  progress_tracking: any;
  created_at: string;
  updated_at: string;
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
  id: string;
  company_id: string;
  indicator_data_id: string;
  document_id?: string;
  evidence_type: 'document' | 'calculation' | 'external_source';
  evidence_description?: string;
  file_path?: string;
  created_at: string;
}

export interface GRIIndicatorHistory {
  id: string;
  company_id: string;
  indicator_data_id: string;
  previous_value?: string;
  new_value?: string;
  change_reason?: string;
  changed_by_user_id: string;
  created_at: string;
}

export interface SuggestedValue {
  suggested_value: number;
  unit: string;
  data_source: string;
  confidence: 'high' | 'medium' | 'low';
}

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

  return (data || []) as GRIIndicatorMapping[];
}

export async function createIndicatorMapping(mapping: Partial<GRIIndicatorMapping>): Promise<GRIIndicatorMapping> {
  const { data, error } = await supabase
    .from('gri_indicator_mappings')
    .insert(mapping as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating indicator mapping:', error);
    throw error;
  }

  return data as GRIIndicatorMapping;
}

export async function updateIndicatorMapping(id: string, updates: Partial<GRIIndicatorMapping>): Promise<GRIIndicatorMapping> {
  const { data, error } = await supabase
    .from('gri_indicator_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating indicator mapping:', error);
    throw error;
  }

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

export async function createIndicatorTarget(target: Partial<GRIIndicatorTarget>): Promise<GRIIndicatorTarget> {
  const { data, error } = await supabase
    .from('gri_indicator_targets')
    .insert(target)
    .select()
    .single();

  if (error) {
    console.error('Error creating indicator target:', error);
    throw error;
  }

  return data;
}

export async function updateIndicatorTarget(id: string, updates: Partial<GRIIndicatorTarget>): Promise<GRIIndicatorTarget> {
  const { data, error } = await supabase
    .from('gri_indicator_targets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating indicator target:', error);
    throw error;
  }

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

export async function createIndicatorEvidence(evidence: Partial<GRIIndicatorEvidence>): Promise<GRIIndicatorEvidence> {
  const { data, error } = await supabase
    .from('gri_indicator_evidence')
    .insert(evidence)
    .select()
    .single();

  if (error) {
    console.error('Error creating indicator evidence:', error);
    throw error;
  }

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

export async function createIndicatorHistory(history: Partial<GRIIndicatorHistory>): Promise<GRIIndicatorHistory> {
  const { data, error } = await supabase
    .from('gri_indicator_history')
    .insert(history)
    .select()
    .single();

  if (error) {
    console.error('Error creating indicator history:', error);
    throw error;
  }

  return data;
}

// Intelligent Suggestions API
export async function getSuggestedValue(indicatorCode: string): Promise<SuggestedValue | null> {
  try {
    const { data, error } = await supabase.rpc('get_indicator_suggested_value', {
      p_company_id: null, // Will use get_user_company_id() in the function
      p_indicator_code: indicatorCode
    });

    if (error) {
      console.error('Error getting suggested value:', error);
      return null;
    }

    return data as SuggestedValue || null;
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
    const in_progress = allIndicators?.filter(ind => ind.value && !ind.is_complete).length || 0;
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
      const category = indicator.indicator?.category || 'Outros';
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