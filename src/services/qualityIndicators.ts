import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Interfaces para os tipos de dados
export interface QualityIndicator {
  id: string;
  company_id: string;
  name: string;
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
}

export interface IndicatorTarget {
  id: string;
  indicator_id: string;
  target_value: number;
  upper_limit?: number;
  lower_limit?: number;
  critical_upper_limit?: number;
  critical_lower_limit?: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface IndicatorMeasurement {
  id: string;
  indicator_id: string;
  measurement_date: string;
  measured_value: number;
  measurement_period_start?: string;
  measurement_period_end?: string;
  data_source_reference?: string;
  collected_by_user_id?: string;
  notes?: string;
  status: 'valid' | 'invalid' | 'under_review';
  deviation_level?: 'none' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface IndicatorAlert {
  id: string;
  indicator_id: string;
  measurement_id: string;
  alert_level: 'warning' | 'critical';
  alert_type: 'upper_limit' | 'lower_limit' | 'trend';
  alert_message: string;
  is_acknowledged: boolean;
  acknowledged_by_user_id?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_by_user_id?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface IndicatorOccurrence {
  id: string;
  company_id: string;
  indicator_id?: string;
  occurrence_date: string;
  occurrence_type: 'deviation' | 'improvement' | 'issue';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_description?: string;
  immediate_actions?: string;
  responsible_user_id?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution_date?: string;
  resolution_description?: string;
  lessons_learned?: string;
  attachments: any[];
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Serviço para gestão de indicadores de qualidade
class QualityIndicatorsService {
  // CRUD Indicadores
  async getIndicators() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company not found');

    const { data, error } = await supabase
      .from('quality_indicators')
      .select(`
        *,
        indicator_targets(*)
      `)
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  async getIndicator(id: string) {
    const { data, error } = await supabase
      .from('quality_indicators')
      .select(`
        *,
        indicator_targets(*),
        indicator_measurements(*),
        indicator_alerts(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createIndicator(indicator: Omit<QualityIndicator, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'created_by_user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('User company not found');

    const { data, error } = await supabase
      .from('quality_indicators')
      .insert({
        ...indicator,
        company_id: profile.company_id,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateIndicator(id: string, updates: Partial<QualityIndicator>) {
    const { data, error } = await supabase
      .from('quality_indicators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteIndicator(id: string) {
    const { error } = await supabase
      .from('quality_indicators')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // CRUD Metas
  async createTarget(target: Omit<IndicatorTarget, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .insert(target)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTarget(id: string, updates: Partial<IndicatorTarget>) {
    const { data, error } = await supabase
      .from('indicator_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // CRUD Medições
  async getMeasurements(indicatorId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('indicator_measurements')
      .select('*')
      .eq('indicator_id', indicatorId)
      .order('measurement_date', { ascending: false });

    if (startDate) query = query.gte('measurement_date', startDate);
    if (endDate) query = query.lte('measurement_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createMeasurement(measurement: Omit<IndicatorMeasurement, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('indicator_measurements')
      .insert({
        ...measurement,
        collected_by_user_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMeasurement(id: string, updates: Partial<IndicatorMeasurement>) {
    const { data, error } = await supabase
      .from('indicator_measurements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Alertas
  async getAlerts(indicatorId?: string) {
    let query = supabase
      .from('indicator_alerts')
      .select(`
        *,
        quality_indicators(name),
        indicator_measurements(measured_value, measurement_date)
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (indicatorId) query = query.eq('indicator_id', indicatorId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async acknowledgeAlert(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('indicator_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by_user_id: user?.id,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async resolveAlert(id: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('indicator_alerts')
      .update({
        is_resolved: true,
        resolved_by_user_id: user?.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Ocorrências
  async getOccurrences() {
    const { data, error } = await supabase
      .from('indicator_occurrences')
      .select(`
        *,
        quality_indicators(name)
      `)
      .order('occurrence_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createOccurrence(occurrence: Omit<IndicatorOccurrence, 'id' | 'company_id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('User company not found');

    const { data, error } = await supabase
      .from('indicator_occurrences')
      .insert({
        ...occurrence,
        company_id: profile.company_id,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Estatísticas
  async getIndicatorStatistics(indicatorId: string, startDate?: string, endDate?: string) {
    const { data, error } = await supabase.rpc('calculate_indicator_statistics', {
      p_indicator_id: indicatorId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) throw error;
    return data;
  }

  // Dashboard
  async getDashboardData() {
    const [indicators, alerts, measurements] = await Promise.all([
      this.getIndicators(),
      this.getAlerts(),
      supabase
        .from('indicator_measurements')
        .select('*')
        .gte('measurement_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('measurement_date', { ascending: false })
    ]);

    return {
      indicators: indicators || [],
      alerts: alerts || [],
      recentMeasurements: measurements.data || []
    };
  }
}

export const qualityIndicatorsService = new QualityIndicatorsService();

// React Query Hooks
export const useQualityIndicators = () => {
  return useQuery({
    queryKey: ['quality-indicators-list'],
    queryFn: () => qualityIndicatorsService.getIndicators(),
    refetchInterval: 30000
  });
};

export const useQualityIndicator = (id: string) => {
  return useQuery({
    queryKey: ['quality-indicator', id],
    queryFn: () => qualityIndicatorsService.getIndicator(id),
    enabled: !!id
  });
};

export const useCreateIndicator = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: qualityIndicatorsService.createIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-indicators-list'] });
      queryClient.invalidateQueries({ queryKey: ['quality-performance'] });
      toast({
        title: "Indicador criado",
        description: "Indicador de qualidade criado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar indicador",
        variant: "destructive"
      });
    }
  });
};

export const useIndicatorMeasurements = (indicatorId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['indicator-measurements', indicatorId, startDate, endDate],
    queryFn: () => qualityIndicatorsService.getMeasurements(indicatorId, startDate, endDate),
    enabled: !!indicatorId
  });
};

export const useCreateMeasurement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: qualityIndicatorsService.createMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-measurements'] });
      queryClient.invalidateQueries({ queryKey: ['indicator-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['quality-indicators-list'] });
      queryClient.invalidateQueries({ queryKey: ['quality-performance'] });
      toast({
        title: "Medição registrada",
        description: "Medição registrada com sucesso"
      });
    }
  });
};

export const useIndicatorAlerts = (indicatorId?: string) => {
  return useQuery({
    queryKey: ['indicator-alerts', indicatorId],
    queryFn: () => qualityIndicatorsService.getAlerts(indicatorId),
    refetchInterval: 60000
  });
};

export const useIndicatorOccurrences = () => {
  return useQuery({
    queryKey: ['indicator-occurrences'],
    queryFn: () => qualityIndicatorsService.getOccurrences()
  });
};

export const useQualityDashboard = () => {
  return useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityIndicatorsService.getDashboardData(),
    refetchInterval: 30000
  });
};