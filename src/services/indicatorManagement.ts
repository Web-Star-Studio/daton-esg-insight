import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

export interface IndicatorGroup {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  parent_group_id?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  indicators_count?: number;
}

export interface IndicatorCollection {
  id: string;
  indicator_id: string;
  company_id: string;
  collection_name: string;
  variable_name: string;
  description?: string;
  measurement_unit?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  collection_type: 'manual' | 'automatic' | 'calculated';
  source_indicator_id?: string;
  formula?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IndicatorPeriodData {
  id: string;
  indicator_id: string;
  collection_id?: string;
  company_id: string;
  period_year: number;
  period_month: number;
  measured_value?: number;
  target_value?: number;
  deviation_value?: number;
  deviation_percentage?: number;
  status: 'on_target' | 'warning' | 'critical' | 'pending' | 'not_applicable';
  needs_action_plan: boolean;
  action_plan_id?: string;
  notes?: string;
  collected_by_user_id?: string;
  collected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtendedQualityIndicator {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  category: string;
  measurement_unit: string;
  measurement_type: 'manual' | 'automatic' | 'calculated';
  calculation_formula?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  responsible_user_id?: string;
  data_source?: string;
  collection_method?: string;
  is_active: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // New fields
  strategic_objective?: string;
  location?: string;
  direction: 'higher_better' | 'lower_better' | 'equal_better';
  tolerance_value?: number;
  icon?: string;
  group_id?: string;
  analysis_user_id?: string;
  auto_analysis: boolean;
  analysis_instructions?: string;
  suggested_actions?: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  // Relations
  indicator_group?: IndicatorGroup;
  indicator_targets?: any[];
  period_data?: IndicatorPeriodData[];
  collections?: IndicatorCollection[];
}

export interface IndicatorStats {
  total: number;
  on_target: number;
  warning: number;
  critical: number;
  pending: number;
  completion_rate: number;
}

// ============================================
// SERVICE CLASS
// ============================================

class IndicatorManagementService {
  private async getCompanyId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company not found');
    return profile.company_id;
  }

  // ============================================
  // GROUPS
  // ============================================

  async getGroups(): Promise<IndicatorGroup[]> {
    const companyId = await this.getCompanyId();

    const { data, error } = await supabase
      .from('indicator_groups')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return (data || []) as IndicatorGroup[];
  }

  async createGroup(group: Partial<IndicatorGroup>): Promise<IndicatorGroup> {
    const companyId = await this.getCompanyId();

    const { data, error } = await supabase
      .from('indicator_groups')
      .insert({
        name: group.name!,
        company_id: companyId,
        description: group.description,
        icon: group.icon,
        color: group.color,
        display_order: group.display_order || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as IndicatorGroup;
  }

  async updateGroup(id: string, updates: Partial<IndicatorGroup>): Promise<IndicatorGroup> {
    const { data, error } = await supabase
      .from('indicator_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('indicator_groups')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================
  // INDICATORS (Extended)
  // ============================================

  async getIndicatorsWithData(year?: number): Promise<ExtendedQualityIndicator[]> {
    const companyId = await this.getCompanyId();
    const currentYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('quality_indicators')
      .select(`
        *,
        indicator_groups(*),
        indicator_targets(*),
        indicator_period_data(*)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Filter period data for current year and map
    return (data || []).map(ind => ({
      ...ind,
      direction: ind.direction || 'higher_better',
      auto_analysis: ind.auto_analysis || false,
      status: ind.status || 'active',
      indicator_group: ind.indicator_groups,
      period_data: (ind.indicator_period_data || []).filter(
        (pd: any) => pd.period_year === currentYear
      )
    })) as ExtendedQualityIndicator[];
  }

  async getIndicatorStats(year?: number): Promise<IndicatorStats> {
    const companyId = await this.getCompanyId();
    const currentYear = year || new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { data: indicators, error: indError } = await supabase
      .from('quality_indicators')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (indError) throw indError;

    const { data: periodData, error: pdError } = await supabase
      .from('indicator_period_data')
      .select('status, indicator_id')
      .eq('company_id', companyId)
      .eq('period_year', currentYear)
      .eq('period_month', currentMonth);

    if (pdError) throw pdError;

    const total = indicators?.length || 0;
    const statusCounts = (periodData || []).reduce((acc: Record<string, number>, pd) => {
      acc[pd.status] = (acc[pd.status] || 0) + 1;
      return acc;
    }, {});

    const measured = (periodData || []).filter(pd => pd.status !== 'pending').length;

    return {
      total,
      on_target: statusCounts['on_target'] || 0,
      warning: statusCounts['warning'] || 0,
      critical: statusCounts['critical'] || 0,
      pending: total - measured,
      completion_rate: total > 0 ? Math.round((measured / total) * 100) : 0
    };
  }

  // ============================================
  // PERIOD DATA
  // ============================================

  async savePeriodData(periodData: Partial<IndicatorPeriodData>): Promise<IndicatorPeriodData> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if exists
    const { data: existing } = await supabase
      .from('indicator_period_data')
      .select('id')
      .eq('indicator_id', periodData.indicator_id!)
      .eq('period_year', periodData.period_year!)
      .eq('period_month', periodData.period_month!)
      .maybeSingle();

    if (existing) {
      // Update
      const { data: updated, error } = await supabase
        .from('indicator_period_data')
        .update({
          measured_value: periodData.measured_value,
          target_value: periodData.target_value,
          status: periodData.status,
          notes: periodData.notes,
          collected_by_user_id: user?.id,
          collected_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return updated as IndicatorPeriodData;
    } else {
      // Insert
      const { data: inserted, error } = await supabase
        .from('indicator_period_data')
        .insert({
          indicator_id: periodData.indicator_id!,
          period_year: periodData.period_year!,
          period_month: periodData.period_month!,
          measured_value: periodData.measured_value,
          target_value: periodData.target_value,
          status: periodData.status || 'pending',
          notes: periodData.notes,
          company_id: companyId,
          collected_by_user_id: user?.id,
          collected_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return inserted as IndicatorPeriodData;
    }
  }

  async getPeriodData(indicatorId: string, year: number): Promise<IndicatorPeriodData[]> {
    const { data, error } = await supabase
      .from('indicator_period_data')
      .select('*')
      .eq('indicator_id', indicatorId)
      .eq('period_year', year)
      .order('period_month');

    if (error) throw error;
    return (data || []) as IndicatorPeriodData[];
  }

  // ============================================
  // COLLECTIONS
  // ============================================

  async getCollections(indicatorId: string): Promise<IndicatorCollection[]> {
    const { data, error } = await supabase
      .from('indicator_collections')
      .select('*')
      .eq('indicator_id', indicatorId)
      .eq('is_active', true)
      .order('collection_name');

    if (error) throw error;
    return (data || []) as IndicatorCollection[];
  }

  async createCollection(collection: Partial<IndicatorCollection>): Promise<IndicatorCollection> {
    const companyId = await this.getCompanyId();

    const { data, error } = await supabase
      .from('indicator_collections')
      .insert({
        indicator_id: collection.indicator_id!,
        collection_name: collection.collection_name!,
        variable_name: collection.variable_name!,
        company_id: companyId,
        description: collection.description,
        measurement_unit: collection.measurement_unit,
        frequency: collection.frequency || 'monthly',
        collection_type: collection.collection_type || 'manual'
      })
      .select()
      .single();

    if (error) throw error;
    return data as IndicatorCollection;
  }
}

export const indicatorManagementService = new IndicatorManagementService();

// ============================================
// REACT QUERY HOOKS
// ============================================

export const useIndicatorGroups = () => {
  return useQuery({
    queryKey: ['indicator-groups'],
    queryFn: () => indicatorManagementService.getGroups()
  });
};

export const useCreateIndicatorGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (group: Partial<IndicatorGroup>) => indicatorManagementService.createGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-groups'] });
      toast({ title: "Grupo criado", description: "Grupo de indicadores criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar grupo", variant: "destructive" });
    }
  });
};

export const useIndicatorsWithData = (year?: number) => {
  return useQuery({
    queryKey: ['indicators-with-data', year],
    queryFn: () => indicatorManagementService.getIndicatorsWithData(year),
    refetchInterval: 60000
  });
};

export const useIndicatorStats = (year?: number) => {
  return useQuery({
    queryKey: ['indicator-stats', year],
    queryFn: () => indicatorManagementService.getIndicatorStats(year),
    refetchInterval: 30000
  });
};

export const useSavePeriodData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<IndicatorPeriodData>) => indicatorManagementService.savePeriodData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['indicator-stats'] });
      toast({ title: "Dados salvos", description: "Valor registrado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao salvar dados", variant: "destructive" });
    }
  });
};

export const useIndicatorPeriodData = (indicatorId: string, year: number) => {
  return useQuery({
    queryKey: ['indicator-period-data', indicatorId, year],
    queryFn: () => indicatorManagementService.getPeriodData(indicatorId, year),
    enabled: !!indicatorId
  });
};

export const useIndicatorCollections = (indicatorId: string) => {
  return useQuery({
    queryKey: ['indicator-collections', indicatorId],
    queryFn: () => indicatorManagementService.getCollections(indicatorId),
    enabled: !!indicatorId
  });
};
