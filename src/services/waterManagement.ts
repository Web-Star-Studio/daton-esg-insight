import { supabase } from '@/integrations/supabase/client';

export interface WaterConsumptionResult {
  total_withdrawal_m3: number;
  total_consumption_m3: number;
  total_discharge_m3: number;
  
  by_source: {
    public_network: number;
    well: number;
    surface_water: number;
    rainwater: number;
    reuse: number;
    third_party: number;
    other: number;
  };
  
  by_quality: {
    freshwater: number;
    other_water: number;
  };
  
  water_stressed_areas_m3: number;
  
  breakdown: Array<{
    source_type: string;
    source_name: string;
    withdrawal_m3: number;
    consumption_m3: number;
    discharge_m3: number;
    quality: string;
    is_stressed_area: boolean;
    period: string;
  }>;
  
  calculation_date: string;
}

export const calculateTotalWaterConsumption = async (
  year: number,
  companyId?: string
): Promise<WaterConsumptionResult> => {
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
  
  const { data: waterData, error } = await supabase
    .from('water_consumption_data')
    .select('*')
    .eq('company_id', targetCompanyId)
    .gte('period_start_date', `${year}-01-01`)
    .lte('period_end_date', `${year}-12-31`);
  
  if (error) throw error;
  
  const result: WaterConsumptionResult = {
    total_withdrawal_m3: 0,
    total_consumption_m3: 0,
    total_discharge_m3: 0,
    by_source: {
      public_network: 0,
      well: 0,
      surface_water: 0,
      rainwater: 0,
      reuse: 0,
      third_party: 0,
      other: 0
    },
    by_quality: {
      freshwater: 0,
      other_water: 0
    },
    water_stressed_areas_m3: 0,
    breakdown: [],
    calculation_date: new Date().toISOString()
  };
  
  waterData?.forEach(record => {
    const withdrawal = record.withdrawal_volume_m3 || 0;
    const consumption = record.consumption_volume_m3 || withdrawal;
    const discharge = record.discharge_volume_m3 || 0;
    
    result.total_withdrawal_m3 += withdrawal;
    result.total_consumption_m3 += consumption;
    result.total_discharge_m3 += discharge;
    
    const sourceType = record.source_type?.toLowerCase() || '';
    if (sourceType.includes('rede pública')) {
      result.by_source.public_network += withdrawal;
    } else if (sourceType.includes('poço')) {
      result.by_source.well += withdrawal;
    } else if (sourceType.includes('superficial') || sourceType.includes('rio') || sourceType.includes('lago')) {
      result.by_source.surface_water += withdrawal;
    } else if (sourceType.includes('chuva')) {
      result.by_source.rainwater += withdrawal;
    } else if (sourceType.includes('reuso') || sourceType.includes('reciclada')) {
      result.by_source.reuse += withdrawal;
    } else if (sourceType.includes('terceiros') || sourceType.includes('caminhão')) {
      result.by_source.third_party += withdrawal;
    } else {
      result.by_source.other += withdrawal;
    }
    
    const tds = record.total_dissolved_solids_mg_l || 0;
    if (tds <= 1000) {
      result.by_quality.freshwater += withdrawal;
    } else {
      result.by_quality.other_water += withdrawal;
    }
    
    if (record.is_water_stressed_area) {
      result.water_stressed_areas_m3 += withdrawal;
    }
    
    result.breakdown.push({
      source_type: record.source_type,
      source_name: record.source_name || 'Não informado',
      withdrawal_m3: Math.round(withdrawal * 1000) / 1000,
      consumption_m3: Math.round(consumption * 1000) / 1000,
      discharge_m3: Math.round(discharge * 1000) / 1000,
      quality: record.water_quality || 'Não informado',
      is_stressed_area: record.is_water_stressed_area || false,
      period: `${record.period_start_date} a ${record.period_end_date}`
    });
  });
  
  result.total_withdrawal_m3 = Math.round(result.total_withdrawal_m3 * 1000) / 1000;
  result.total_consumption_m3 = Math.round(result.total_consumption_m3 * 1000) / 1000;
  result.total_discharge_m3 = Math.round(result.total_discharge_m3 * 1000) / 1000;
  result.water_stressed_areas_m3 = Math.round(result.water_stressed_areas_m3 * 1000) / 1000;
  
  return result;
};

export const saveWaterConsumptionRecord = async (
  record: Partial<any>
): Promise<any> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  
  const recordToInsert = {
    ...record,
    company_id: profile.company_id,
    year: new Date(record.period_start_date).getFullYear(),
    created_by: user.id
  };
  
  const { data, error } = await supabase
    .from('water_consumption_data')
    .insert([recordToInsert as any])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getWaterConsumptionRecords = async (
  startDate: string,
  endDate: string
): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  
  const { data, error } = await supabase
    .from('water_consumption_data')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('period_start_date', startDate)
    .lte('period_end_date', endDate)
    .order('period_start_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const calculateWaterIntensity = async (
  year: number
): Promise<{
  intensity_per_production?: number;
  intensity_per_revenue?: number;
  total_water_m3: number;
  production_volume?: number;
  production_unit?: string;
  revenue_brl?: number;
  baseline_intensity?: number;
  is_improving?: boolean;
  improvement_percent?: number;
}> => {
  const waterData = await calculateTotalWaterConsumption(year);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  
  const { data: metrics } = await supabase
    .from('operational_metrics')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('period_start_date', `${year}-01-01`)
    .lte('period_end_date', `${year}-12-31`);
  
  // ✅ CORRIGIDO: Usar CONSUMO (GRI 303-5), não RETIRADA (GRI 303-3)
  const result: any = {
    total_water_m3: waterData.total_consumption_m3  // CORRETO - Consumo real
  };
  
  if (metrics && metrics.length > 0) {
    const aggregated = metrics.reduce((acc, m) => ({
      production_volume: (acc.production_volume || 0) + (m.production_volume || 0),
      production_unit: m.production_unit || acc.production_unit,
      revenue_brl: (acc.revenue_brl || 0) + (m.revenue_brl || 0)
    }), {} as any);
    
    if (aggregated.production_volume > 0) {
      result.intensity_per_production = waterData.total_consumption_m3 / aggregated.production_volume;  // CORRETO
      result.production_volume = aggregated.production_volume;
      result.production_unit = aggregated.production_unit;
    }
    
    if (aggregated.revenue_brl > 0) {
      result.intensity_per_revenue = (waterData.total_consumption_m3 / aggregated.revenue_brl) * 1000;  // CORRETO
      result.revenue_brl = aggregated.revenue_brl;
    }
  }
  
  // Comparar com ano anterior para medir melhoria
  let previousYearIntensity = null;
  try {
    const previousWater = await calculateTotalWaterConsumption(year - 1);
    const { data: prevMetrics } = await supabase
      .from('operational_metrics')
      .select('*')
      .eq('company_id', profile.company_id)
      .gte('period_start_date', `${year - 1}-01-01`)
      .lte('period_end_date', `${year - 1}-12-31`);
    
    if (prevMetrics && prevMetrics.length > 0) {
      const prevProduction = prevMetrics.reduce((sum, m) => sum + (m.production_volume || 0), 0);
      if (prevProduction > 0) {
        previousYearIntensity = previousWater.total_consumption_m3 / prevProduction;
      }
    }
  } catch (error) {
    console.log('Dados do ano anterior não disponíveis');
  }
  
  result.baseline_intensity = previousYearIntensity;
  result.is_improving = previousYearIntensity && result.intensity_per_production 
    ? result.intensity_per_production < previousYearIntensity
    : null;
  
  if (result.is_improving !== null && previousYearIntensity) {
    result.improvement_percent = ((previousYearIntensity - result.intensity_per_production!) / previousYearIntensity) * 100;
  }
  
  return result;
};

/**
 * Calcula percentual de água reutilizada (Economia Circular)
 * GRI 303-3 - Práticas de circularidade hídrica
 */
export const calculateWaterReusePercentage = async (
  year: number
): Promise<{
  reuse_percentage: number;
  reuse_volume_m3: number;
  total_consumption_m3: number;
  baseline_reuse_percentage?: number;
  is_improving?: boolean;
  improvement_percent?: number;
  reuse_by_type: {
    industrial_process: number;
    cooling: number;
    irrigation: number;
    sanitation: number;
    other: number;
  };
}> => {
  // 1. Obter dados de consumo total de água
  const waterData = await calculateTotalWaterConsumption(year);
  
  // 2. Volume de água reutilizada já está em waterData.by_source.reuse
  const reuseVolume = waterData.by_source.reuse;
  
  // 3. Calcular percentual (sobre CONSUMO, não retirada)
  const reusePercentage = waterData.total_consumption_m3 > 0
    ? (reuseVolume / waterData.total_consumption_m3) * 100
    : 0;
  
  // 4. Buscar dados do ano anterior para comparação
  let baselinePercentage: number | undefined = undefined;
  let isImproving: boolean | undefined = undefined;
  let improvementPercent: number | undefined = undefined;
  
  try {
    const previousYearData = await calculateTotalWaterConsumption(year - 1);
    const previousReuse = previousYearData.by_source.reuse;
    
    if (previousYearData.total_consumption_m3 > 0) {
      baselinePercentage = (previousReuse / previousYearData.total_consumption_m3) * 100;
      
      // Melhoria = AUMENTO do percentual de reuso
      isImproving = reusePercentage > baselinePercentage;
      improvementPercent = reusePercentage - baselinePercentage;
    }
  } catch (error) {
    console.log('Dados do ano anterior não disponíveis para comparação');
  }
  
  // 5. Buscar breakdown detalhado por tipo de reuso
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  
  const { data: reuseData } = await supabase
    .from('water_consumption_data')
    .select('*')
    .eq('company_id', profile.company_id)
    .ilike('source_type', '%reuso%')
    .gte('period_start_date', `${year}-01-01`)
    .lte('period_end_date', `${year}-12-31`);
  
  // 6. Classificar tipos de reuso (baseado em source_name ou notes)
  const reuseByType = {
    industrial_process: 0,
    cooling: 0,
    irrigation: 0,
    sanitation: 0,
    other: 0
  };
  
  reuseData?.forEach(record => {
    const withdrawal = record.withdrawal_volume_m3 || 0;
    const sourceName = (record.source_name || '').toLowerCase();
    const notes = (record.notes || '').toLowerCase();
    
    if (sourceName.includes('processo') || notes.includes('processo')) {
      reuseByType.industrial_process += withdrawal;
    } else if (sourceName.includes('resfriamento') || sourceName.includes('cooling') || notes.includes('torre')) {
      reuseByType.cooling += withdrawal;
    } else if (sourceName.includes('irrigação') || sourceName.includes('jardim') || notes.includes('paisagismo')) {
      reuseByType.irrigation += withdrawal;
    } else if (sourceName.includes('sanitário') || sourceName.includes('vaso') || notes.includes('descarga')) {
      reuseByType.sanitation += withdrawal;
    } else {
      reuseByType.other += withdrawal;
    }
  });
  
  return {
    reuse_percentage: Math.round(reusePercentage * 100) / 100,
    reuse_volume_m3: Math.round(reuseVolume * 1000) / 1000,
    total_consumption_m3: Math.round(waterData.total_consumption_m3 * 1000) / 1000,
    baseline_reuse_percentage: baselinePercentage ? Math.round(baselinePercentage * 100) / 100 : undefined,
    is_improving: isImproving,
    improvement_percent: improvementPercent ? Math.round(improvementPercent * 100) / 100 : undefined,
    reuse_by_type: reuseByType
  };
};
