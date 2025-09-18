import { supabase } from "@/integrations/supabase/client";

export interface ESGPerformanceIndicator {
  id: string;
  company_id: string;
  indicator_code: string;
  indicator_name: string;
  esg_category: 'Environmental' | 'Social' | 'Governance';
  measurement_unit?: string;
  target_value?: number;
  current_value?: number;
  reporting_period: string;
  data_source?: string;
  calculation_method?: string;
  is_kpi: boolean;
  benchmark_value?: number;
  trend?: 'Melhorando' | 'Estável' | 'Piorando';
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
}

export const getESGPerformanceIndicators = async () => {
  const { data, error } = await supabase
    .from('esg_performance_indicators')
    .select('*')
    .order('reporting_period', { ascending: false });

  if (error) throw error;
  return data;
};

export const getESGPerformanceIndicator = async (id: string) => {
  const { data, error } = await supabase
    .from('esg_performance_indicators')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createESGPerformanceIndicator = async (indicator: Omit<ESGPerformanceIndicator, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('esg_performance_indicators')
    .insert(indicator)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateESGPerformanceIndicator = async (id: string, updates: Partial<ESGPerformanceIndicator>) => {
  const { data, error } = await supabase
    .from('esg_performance_indicators')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteESGPerformanceIndicator = async (id: string) => {
  const { error } = await supabase
    .from('esg_performance_indicators')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getPerformanceDashboard = async () => {
  const { data: indicators, error } = await supabase
    .from('esg_performance_indicators')
    .select('*');

  if (error) throw error;

  const totalIndicators = indicators.length;
  const kpis = indicators.filter(i => i.is_kpi);
  
  const indicatorsByCategory = indicators.reduce((acc, indicator) => {
    acc[indicator.esg_category] = (acc[indicator.esg_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const performanceByCategory = {
    Environmental: calculateCategoryPerformance(indicators.filter(i => i.esg_category === 'Environmental') as ESGPerformanceIndicator[]),
    Social: calculateCategoryPerformance(indicators.filter(i => i.esg_category === 'Social') as ESGPerformanceIndicator[]),
    Governance: calculateCategoryPerformance(indicators.filter(i => i.esg_category === 'Governance') as ESGPerformanceIndicator[])
  };

  const trendDistribution = indicators.reduce((acc, indicator) => {
    const trend = indicator.trend || 'Estável';
    acc[trend] = (acc[trend] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const targetAchievement = indicators.filter(i => 
    i.target_value && i.current_value && i.current_value >= i.target_value
  ).length;

  const targetAchievementRate = totalIndicators > 0 ? 
    (targetAchievement / indicators.filter(i => i.target_value).length) * 100 : 0;

  return {
    totalIndicators,
    totalKPIs: kpis.length,
    indicatorsByCategory,
    performanceByCategory,
    trendDistribution,
    targetAchievementRate: Number(targetAchievementRate.toFixed(1)),
    recentIndicators: indicators
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
  };
};

const calculateCategoryPerformance = (indicators: ESGPerformanceIndicator[]) => {
  if (indicators.length === 0) return { score: 0, trend: 'Estável' };

  const withTargets = indicators.filter(i => i.target_value && i.current_value);
  if (withTargets.length === 0) return { score: 0, trend: 'Estável' };

  const achievedTargets = withTargets.filter(i => 
    i.current_value! >= i.target_value!
  ).length;

  const score = (achievedTargets / withTargets.length) * 100;

  const improving = indicators.filter(i => i.trend === 'Melhorando').length;
  const worsening = indicators.filter(i => i.trend === 'Piorando').length;

  let trend: 'Melhorando' | 'Estável' | 'Piorando' = 'Estável';
  if (improving > worsening) trend = 'Melhorando';
  else if (worsening > improving) trend = 'Piorando';

  return { score: Number(score.toFixed(1)), trend };
};

export const getIndicatorTimeSeries = async (indicatorCode: string) => {
  const { data, error } = await supabase
    .from('esg_performance_indicators')
    .select('*')
    .eq('indicator_code', indicatorCode)
    .order('reporting_period');

  if (error) throw error;

  return data.map(indicator => ({
    period: indicator.reporting_period,
    value: indicator.current_value || 0,
    target: indicator.target_value,
    benchmark: indicator.benchmark_value
  }));
};