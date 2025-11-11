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
  
  const result: any = {
    total_water_m3: waterData.total_withdrawal_m3
  };
  
  if (metrics && metrics.length > 0) {
    const aggregated = metrics.reduce((acc, m) => ({
      production_volume: (acc.production_volume || 0) + (m.production_volume || 0),
      production_unit: m.production_unit || acc.production_unit,
      revenue_brl: (acc.revenue_brl || 0) + (m.revenue_brl || 0)
    }), {} as any);
    
    if (aggregated.production_volume > 0) {
      result.intensity_per_production = waterData.total_withdrawal_m3 / aggregated.production_volume;
      result.production_volume = aggregated.production_volume;
      result.production_unit = aggregated.production_unit;
    }
    
    if (aggregated.revenue_brl > 0) {
      result.intensity_per_revenue = (waterData.total_withdrawal_m3 / aggregated.revenue_brl) * 1000;
      result.revenue_brl = aggregated.revenue_brl;
    }
  }
  
  return result;
};
