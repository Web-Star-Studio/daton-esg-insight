import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Unified interfaces for quality management
export interface QualityDashboard {
  metrics: {
    totalNCs: number;
    openNCs: number;
    resolvedNCs: number;
    totalRisks: number;
    criticalRisks: number;
    actionPlans: number;
    overdueActions: number;
    qualityScore: number;
    avgResolutionTime: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
  recentNCs: Array<{
    id: string;
    nc_number: string;
    title: string;
    severity: string;
    status: string;
    created_at: string;
  }>;
  plansProgress: Array<{
    id: string;
    title: string;
    status: string;
    totalItems: number;
    completedItems: number;
    avgProgress: number;
    overdueItems: number;
  }>;
  insights: QualityInsight[];
}

export interface QualityInsight {
  id: string;
  type: 'warning' | 'critical' | 'success' | 'info';
  category: string;
  title: string;
  description: string;
  impact: 'Alto' | 'Médio' | 'Baixo' | 'Crítico' | 'Positivo';
  action: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

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

export interface PredictiveAnalysis {
  nextMonthNCs: number;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

class UnifiedQualityService {
  async getQualityDashboard(): Promise<QualityDashboard> {
    try {
      // Use edge function for comprehensive dashboard data
      const { data, error } = await supabase.functions.invoke('quality-management', {
        body: { action: 'dashboard' }
      });

      if (error) {
        console.error('Error fetching quality dashboard:', error);
        throw error;
      }

      // Enhance with AI insights
      const insights = await this.generateQualityInsights(data);

      return {
        ...data,
        insights
      };
    } catch (error) {
      console.error('Error in getQualityDashboard:', error);
      throw error;
    }
  }

  async getQualityIndicators(): Promise<QualityIndicator[]> {
    const { data, error } = await supabase
      .from('quality_indicators')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching quality indicators:', error);
      throw error;
    }

    // Type assertion to handle database type differences
    return (data || []).map(item => ({
      ...item,
      measurement_type: item.measurement_type as 'manual' | 'automatic' | 'calculated',
      frequency: item.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly'
    }));
  }

  async createQualityIndicator(indicator: Partial<QualityIndicator>): Promise<QualityIndicator> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company not found');

    const { data, error } = await supabase
      .from('quality_indicators')
      .insert([{
        name: indicator.name!,
        category: indicator.category!,
        measurement_unit: indicator.measurement_unit!,
        measurement_type: indicator.measurement_type!,
        frequency: indicator.frequency!,
        description: indicator.description,
        calculation_formula: indicator.calculation_formula,
        data_source: indicator.data_source,
        collection_method: indicator.collection_method,
        responsible_user_id: indicator.responsible_user_id,
        is_active: indicator.is_active ?? true,
        company_id: profile.company_id,
        created_by_user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating quality indicator:', error);
      throw error;
    }

    return {
      ...data,
      measurement_type: data.measurement_type as 'manual' | 'automatic' | 'calculated',
      frequency: data.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly'
    };
  }

  async getIndicatorMeasurements(indicatorId: string): Promise<IndicatorMeasurement[]> {
    const { data, error } = await supabase
      .from('indicator_measurements')
      .select('*')
      .eq('indicator_id', indicatorId)
      .order('measurement_date', { ascending: false });

    if (error) {
      console.error('Error fetching indicator measurements:', error);
      throw error;
    }

    // Type assertion to handle database type differences
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'valid' | 'invalid' | 'under_review',
      deviation_level: (item.deviation_level || 'none') as 'none' | 'warning' | 'critical'
    }));
  }

  async addIndicatorMeasurement(measurement: Partial<IndicatorMeasurement>): Promise<IndicatorMeasurement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('indicator_measurements')
      .insert([{
        indicator_id: measurement.indicator_id!,
        measurement_date: measurement.measurement_date!,
        measured_value: measurement.measured_value!,
        measurement_period_start: measurement.measurement_period_start,
        measurement_period_end: measurement.measurement_period_end,
        data_source_reference: measurement.data_source_reference,
        notes: measurement.notes,
        status: measurement.status || 'valid',
        collected_by_user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding indicator measurement:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as 'valid' | 'invalid' | 'under_review',
      deviation_level: (data.deviation_level || 'none') as 'none' | 'warning' | 'critical'
    };
  }

  async getPredictiveAnalysis(): Promise<PredictiveAnalysis> {
    try {
      // Get historical data for analysis
      const { data: historicalNCs } = await supabase
        .from('non_conformities')
        .select('created_at, severity, status')
        .order('created_at', { ascending: false })
        .limit(100);

      // Simple predictive analysis based on trends
      const recentNCs = historicalNCs?.filter(nc => {
        const created = new Date(nc.created_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return created >= monthAgo;
      }) || [];

      const nextMonthNCs = Math.max(1, Math.round(recentNCs.length * 1.1));
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (nextMonthNCs > 10) riskLevel = 'high';
      else if (nextMonthNCs > 5) riskLevel = 'medium';

      const patterns = [
        {
          type: 'Seasonal',
          confidence: 0.75,
          description: 'Aumento de não conformidades no final do trimestre'
        },
        {
          type: 'Process',
          confidence: 0.68,
          description: 'Correlação entre treinamentos e redução de NCs'
        }
      ];

      const recommendations = [
        {
          title: 'Implementar treinamentos preventivos',
          description: 'Intensificar treinamentos antes dos picos sazonais',
          impact: 'Alto',
          effort: 'Médio',
          priority: 'high' as const
        },
        {
          title: 'Automatizar monitoramento de processos críticos',
          description: 'Implementar alertas automáticos para desvios',
          impact: 'Médio',
          effort: 'Alto',
          priority: 'medium' as const
        }
      ];

      return {
        nextMonthNCs,
        riskLevel,
        patterns,
        recommendations
      };
    } catch (error) {
      console.error('Error in predictive analysis:', error);
      throw error;
    }
  }

  private async generateQualityInsights(dashboardData: any): Promise<QualityInsight[]> {
    const insights: QualityInsight[] = [];

    // Critical issues insight
    if (dashboardData.metrics?.criticalRisks > 0) {
      insights.push({
        id: 'critical-risks',
        type: 'critical',
        category: 'Riscos',
        title: 'Riscos Críticos Identificados',
        description: `${dashboardData.metrics.criticalRisks} riscos críticos requerem atenção imediata`,
        impact: 'Crítico',
        action: 'Implementar planos de mitigação urgentes',
        confidence: 0.95,
        priority: 'high',
        createdAt: new Date()
      });
    }

    // Overdue actions insight
    if (dashboardData.metrics?.overdueActions > 5) {
      insights.push({
        id: 'overdue-actions',
        type: 'warning',
        category: 'Planos de Ação',
        title: 'Ações em Atraso',
        description: `${dashboardData.metrics.overdueActions} ações estão atrasadas`,
        impact: 'Alto',
        action: 'Revisar cronograma e recursos dos planos de ação',
        confidence: 0.88,
        priority: 'high',
        createdAt: new Date()
      });
    }

    // Positive trend insight
    if (dashboardData.metrics?.trendDirection === 'down') {
      insights.push({
        id: 'positive-trend',
        type: 'success',
        category: 'Performance',
        title: 'Tendência Positiva',
        description: 'Redução consistente no número de não conformidades',
        impact: 'Positivo',
        action: 'Manter práticas atuais e documentar boas práticas',
        confidence: 0.82,
        priority: 'medium',
        createdAt: new Date()
      });
    }

    return insights;
  }

  async getQualityMetrics() {
    const { data, error } = await supabase.functions.invoke('quality-management', {
      body: { action: 'dashboard' }
    });

    if (error) throw error;
    return data?.metrics || {};
  }

  async getNonConformityStats() {
    const { data, error } = await supabase.functions.invoke('quality-management', {
      body: { action: 'nc-stats' }
    });

    if (error) throw error;
    return data || {};
  }

  async getActionPlansProgress() {
    const { data, error } = await supabase.functions.invoke('quality-management', {
      body: { action: 'action-plans' }
    });

    if (error) throw error;
    return data || [];
  }
}

// React Query hooks for the unified service
export const useQualityDashboard = () => {
  return useQuery({
    queryKey: ['unified-quality-dashboard'],
    queryFn: () => unifiedQualityService.getQualityDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // 30 seconds
  });
};

export const useQualityIndicators = () => {
  return useQuery({
    queryKey: ['quality-indicators'],
    queryFn: () => unifiedQualityService.getQualityIndicators(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useIndicatorMeasurements = (indicatorId: string) => {
  return useQuery({
    queryKey: ['indicator-measurements', indicatorId],
    queryFn: () => unifiedQualityService.getIndicatorMeasurements(indicatorId),
    enabled: !!indicatorId,
  });
};

export const usePredictiveAnalysis = () => {
  return useQuery({
    queryKey: ['predictive-analysis'],
    queryFn: () => unifiedQualityService.getPredictiveAnalysis(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCreateQualityIndicator = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (indicator: Partial<QualityIndicator>) => 
      unifiedQualityService.createQualityIndicator(indicator),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-indicators'] });
      toast({
        title: "Sucesso",
        description: "Indicador de qualidade criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar indicador de qualidade",
      });
    },
  });
};

export const useAddIndicatorMeasurement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (measurement: Partial<IndicatorMeasurement>) => 
      unifiedQualityService.addIndicatorMeasurement(measurement),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['indicator-measurements', variables.indicator_id] 
      });
      queryClient.invalidateQueries({ queryKey: ['unified-quality-dashboard'] });
      toast({
        title: "Sucesso",
        description: "Medição adicionada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar medição",
      });
    },
  });
};

// Export singleton instance
export const unifiedQualityService = new UnifiedQualityService();