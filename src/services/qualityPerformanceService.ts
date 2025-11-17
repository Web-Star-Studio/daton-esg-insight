import { supabase } from "@/integrations/supabase/client";

export interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface QualityPerformanceData {
  metrics: QualityMetric[];
  overallScore: number;
}

/**
 * Determina se maior é melhor baseado na categoria do indicador
 */
const isHigherBetter = (category: string, name: string): boolean => {
  const lowerIsBetterCategories = ['tempo', 'custo', 'defeito', 'reclamação', 'rejeição', 'perda'];
  const categoryLower = category.toLowerCase();
  const nameLower = name.toLowerCase();
  
  return !lowerIsBetterCategories.some(term => 
    categoryLower.includes(term) || nameLower.includes(term)
  );
};

/**
 * Calcula a tendência comparando o valor atual com valores anteriores
 */
const calculateTrend = (
  currentValue: number,
  previousValue: number | null,
  higherIsBetter: boolean
): 'up' | 'down' | 'stable' => {
  if (previousValue === null) return 'stable';
  
  const diff = currentValue - previousValue;
  const threshold = Math.abs(previousValue * 0.05); // 5% de variação
  
  if (Math.abs(diff) < threshold) return 'stable';
  
  if (higherIsBetter) {
    return diff > 0 ? 'up' : 'down';
  } else {
    return diff < 0 ? 'up' : 'down';
  }
};

/**
 * Determina o status baseado nos limites configurados
 */
const calculateStatus = (
  currentValue: number,
  target: number,
  criticalLowerLimit: number | null,
  criticalUpperLimit: number | null,
  lowerLimit: number | null,
  upperLimit: number | null,
  higherIsBetter: boolean
): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (higherIsBetter) {
    // Para indicadores onde maior é melhor
    if (criticalLowerLimit !== null && currentValue < criticalLowerLimit) return 'critical';
    if (lowerLimit !== null && currentValue < lowerLimit) return 'warning';
    if (currentValue >= target) return 'excellent';
    return 'good';
  } else {
    // Para indicadores onde menor é melhor
    if (criticalUpperLimit !== null && currentValue > criticalUpperLimit) return 'critical';
    if (upperLimit !== null && currentValue > upperLimit) return 'warning';
    if (currentValue <= target) return 'excellent';
    return 'good';
  }
};

/**
 * Busca dados de performance de qualidade do banco de dados
 */
export const fetchQualityPerformanceData = async (
  companyId: string
): Promise<QualityPerformanceData> => {
  // Buscar indicadores ativos
  const { data: indicators, error: indicatorsError } = await supabase
    .from('quality_indicators')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(6);

  if (indicatorsError) throw indicatorsError;
  if (!indicators || indicators.length === 0) {
    return { metrics: [], overallScore: 0 };
  }

  const metrics: QualityMetric[] = [];

  for (const indicator of indicators) {
    // Buscar target atual
    const { data: targets } = await supabase
      .from('indicator_targets')
      .select('*')
      .eq('indicator_id', indicator.id)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .order('valid_from', { ascending: false })
      .limit(1);

    const target = targets?.[0];
    if (!target) continue;

    // Buscar medições recentes (últimas 2 para calcular tendência)
    const { data: measurements } = await supabase
      .from('indicator_measurements')
      .select('*')
      .eq('indicator_id', indicator.id)
      .order('measurement_date', { ascending: false })
      .limit(2);

    if (!measurements || measurements.length === 0) continue;

    const currentMeasurement = measurements[0];
    const previousMeasurement = measurements.length > 1 ? measurements[1] : null;

    const higherIsBetter = isHigherBetter(indicator.category, indicator.name);

    const trend = calculateTrend(
      currentMeasurement.measured_value,
      previousMeasurement?.measured_value || null,
      higherIsBetter
    );

    const status = calculateStatus(
      currentMeasurement.measured_value,
      target.target_value,
      target.critical_lower_limit,
      target.critical_upper_limit,
      target.lower_limit,
      target.upper_limit,
      higherIsBetter
    );

    metrics.push({
      id: indicator.id,
      name: indicator.name,
      value: currentMeasurement.measured_value,
      target: target.target_value,
      unit: indicator.measurement_unit || '%',
      trend,
      status,
    });
  }

  // Calcular score geral (média das performances)
  let totalScore = 0;
  metrics.forEach(metric => {
    const higherIsBetter = isHigherBetter('', metric.name);
    let performance;
    
    if (higherIsBetter) {
      performance = (metric.value / metric.target) * 100;
    } else {
      performance = (metric.target / metric.value) * 100;
    }
    
    totalScore += Math.min(performance, 100);
  });
  
  const overallScore = metrics.length > 0 ? totalScore / metrics.length : 0;

  return { metrics, overallScore };
};
