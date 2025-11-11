import { supabase } from '@/integrations/supabase/client';
import { calculateTotalEnergyConsumption } from './integratedReportsHelpers';

export interface OperationalMetric {
  id?: string;
  company_id: string;
  year: number;
  month?: number;
  period_start_date: string;
  period_end_date: string;
  production_volume?: number;
  production_unit?: string;
  production_type?: string;
  distance_traveled_km?: number;
  operational_hours?: number;
  service_units?: number;
  revenue_brl?: number;
  operational_area_m2?: number;
  notes?: string;
  data_source?: string;
}

export interface EnergyIntensityResult {
  // Intensidades calculadas
  intensity_per_production?: number; // kWh/unidade produzida
  intensity_per_revenue?: number; // kWh/R$1000
  intensity_per_km?: number; // kWh/km
  intensity_per_m2?: number; // kWh/m²
  intensity_per_hour?: number; // kWh/hora
  
  // Contexto
  total_energy_kwh: number;
  production_volume?: number;
  production_unit?: string;
  revenue_brl?: number;
  distance_km?: number;
  area_m2?: number;
  operational_hours?: number;
  
  // Comparações
  baseline_intensity?: number;
  intensity_variation_percent?: number;
  is_improving: boolean;
}

/**
 * Buscar métricas operacionais de um período
 */
export const getOperationalMetrics = async (
  companyId: string,
  startDate: string,
  endDate: string
): Promise<OperationalMetric[]> => {
  const { data, error } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('company_id', companyId)
    .gte('period_start_date', startDate)
    .lte('period_end_date', endDate)
    .order('period_start_date');
  
  if (error) throw error;
  return data || [];
};

/**
 * Salvar/atualizar métrica operacional
 */
export const saveOperationalMetric = async (
  metric: OperationalMetric
): Promise<OperationalMetric> => {
  const { data, error } = await supabase
    .from('operational_metrics')
    .upsert(metric)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Calcular intensidade energética com base nos dados disponíveis
 */
export const calculateEnergyIntensity = async (
  year: number,
  companyId?: string
): Promise<EnergyIntensityResult> => {
  // 1. Obter consumo total de energia do ano
  const energyData = await calculateTotalEnergyConsumption(year);
  
  // 2. Obter company_id se não fornecido
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    targetCompanyId = profile?.company_id;
  }
  
  if (!targetCompanyId) throw new Error('Empresa não encontrada');
  
  // 3. Buscar métricas operacionais do ano
  const metrics = await getOperationalMetrics(
    targetCompanyId,
    `${year}-01-01`,
    `${year}-12-31`
  );
  
  // 4. Agregar métricas do ano
  const aggregated = metrics.reduce((acc, m) => ({
    production_volume: (acc.production_volume || 0) + (m.production_volume || 0),
    production_unit: m.production_unit || acc.production_unit,
    revenue_brl: (acc.revenue_brl || 0) + (m.revenue_brl || 0),
    distance_km: (acc.distance_km || 0) + (m.distance_traveled_km || 0),
    operational_hours: (acc.operational_hours || 0) + (m.operational_hours || 0),
    area_m2: m.operational_area_m2 || acc.area_m2
  }), {} as any);
  
  // 5. Calcular intensidades
  const result: EnergyIntensityResult = {
    total_energy_kwh: energyData.total_kwh,
    is_improving: false,
    ...aggregated
  };
  
  // Intensidade por produção
  if (aggregated.production_volume && aggregated.production_volume > 0) {
    result.intensity_per_production = energyData.total_kwh / aggregated.production_volume;
  }
  
  // Intensidade por receita (kWh / R$ 1.000)
  if (aggregated.revenue_brl && aggregated.revenue_brl > 0) {
    result.intensity_per_revenue = (energyData.total_kwh / aggregated.revenue_brl) * 1000;
  }
  
  // Intensidade por distância
  if (aggregated.distance_km && aggregated.distance_km > 0) {
    result.intensity_per_km = energyData.total_kwh / aggregated.distance_km;
  }
  
  // Intensidade por área
  if (aggregated.area_m2 && aggregated.area_m2 > 0) {
    result.intensity_per_m2 = energyData.total_kwh / aggregated.area_m2;
  }
  
  // Intensidade por hora operacional
  if (aggregated.operational_hours && aggregated.operational_hours > 0) {
    result.intensity_per_hour = energyData.total_kwh / aggregated.operational_hours;
  }
  
  // 6. Comparar com ano anterior (baseline)
  const previousYearMetrics = await getOperationalMetrics(
    targetCompanyId,
    `${year - 1}-01-01`,
    `${year - 1}-12-31`
  );
  
  if (previousYearMetrics.length > 0 && result.intensity_per_production) {
    const previousEnergyData = await calculateTotalEnergyConsumption(year - 1);
    const previousProduction = previousYearMetrics.reduce(
      (sum, m) => sum + (m.production_volume || 0), 0
    );
    
    if (previousProduction > 0) {
      result.baseline_intensity = previousEnergyData.total_kwh / previousProduction;
      result.intensity_variation_percent = 
        ((result.intensity_per_production - result.baseline_intensity) / result.baseline_intensity) * 100;
      result.is_improving = result.intensity_variation_percent < 0;
    }
  }
  
  return result;
};
