import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EnergyConsumptionRecord {
  id?: string;
  company_id?: string;
  year: number;
  period_start_date: string;
  period_end_date: string;
  energy_source_type: string;
  energy_source_name?: string;
  consumption_value: number;
  consumption_unit: string;
  is_renewable: boolean;
  is_from_grid: boolean;
  is_self_generated: boolean;
  cost_brl?: number;
  production_volume?: number;
  production_unit?: string;
  revenue_brl?: number;
  notes?: string;
  data_source?: string;
  data_quality_score?: number;
  created_by?: string;
}

export interface EnergyConsumptionResult {
  total_consumption_gj: number;
  total_consumption_kwh: number;
  total_cost_brl: number;
  renewable_percentage: number;
  by_source: {
    grid: number;
    solar: number;
    diesel: number;
    gasoline: number;
    natural_gas: number;
    biomass: number;
    other: number;
  };
  by_type: {
    renewable: number;
    non_renewable: number;
  };
  energy_intensity_gj_per_revenue?: number;
  energy_intensity_gj_per_unit?: number;
  breakdown: Array<{
    source_type: string;
    source_name: string;
    consumption_gj: number;
    consumption_kwh: number;
    cost_brl: number;
    is_renewable: boolean;
  }>;
}

/**
 * Converter unidades para GJ (Gigajoules) - unidade padrão do GRI 302
 */
function convertToGJ(value: number, unit: string): number {
  const unitLower = unit.toLowerCase().trim();
  
  switch (unitLower) {
    case 'kwh':
      return value * 0.0036; // 1 kWh = 0.0036 GJ
    case 'mwh':
      return value * 3.6; // 1 MWh = 3.6 GJ
    case 'gj':
      return value;
    case 'litros': // Assumindo diesel (~38 MJ/L)
    case 'litros diesel':
      return value * 0.038; // 1 litro diesel ≈ 0.038 GJ
    case 'litros gasolina':
      return value * 0.032; // 1 litro gasolina ≈ 0.032 GJ
    case 'kg': // Assumindo GLP (~46 MJ/kg)
    case 'kg glp':
      return value * 0.046; // 1 kg GLP ≈ 0.046 GJ
    case 'm3': // Gás natural (~38 MJ/m³)
    case 'm3 gas natural':
      return value * 0.038;
    default:
      logger.warn(`Unidade de energia não reconhecida: ${unit}`, 'emission');
      return value * 0.0036; // Default para kWh
  }
}

/**
 * Converter GJ para kWh
 */
function convertGJtoKWh(gj: number): number {
  return gj / 0.0036;
}

/**
 * Salvar registro de consumo de energia
 */
export const saveEnergyConsumptionRecord = async (
  record: EnergyConsumptionRecord
): Promise<EnergyConsumptionRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const recordData = {
    ...record,
    company_id: profile.company_id,
    created_by: user.id
  };

  const { data, error } = await supabase
    .from('energy_consumption_data')
    .upsert(recordData, {
      onConflict: 'company_id,year,period_start_date,energy_source_type,energy_source_name'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Calcular consumo total de energia (GRI 302-1)
 */
export const calculateTotalEnergyConsumption = async (
  year: number
): Promise<EnergyConsumptionResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const { data: records, error } = await supabase
    .from('energy_consumption_data')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('year', year);

  if (error) throw error;
  if (!records || records.length === 0) {
    return {
      total_consumption_gj: 0,
      total_consumption_kwh: 0,
      total_cost_brl: 0,
      renewable_percentage: 0,
      by_source: {
        grid: 0,
        solar: 0,
        diesel: 0,
        gasoline: 0,
        natural_gas: 0,
        biomass: 0,
        other: 0
      },
      by_type: {
        renewable: 0,
        non_renewable: 0
      },
      breakdown: []
    };
  }

  let totalGJ = 0;
  let totalCost = 0;
  let renewableGJ = 0;
  let nonRenewableGJ = 0;
  
  const bySource = {
    grid: 0,
    solar: 0,
    diesel: 0,
    gasoline: 0,
    natural_gas: 0,
    biomass: 0,
    other: 0
  };

  const breakdown = records.map(record => {
    const consumptionGJ = convertToGJ(record.consumption_value, record.consumption_unit);
    const consumptionKWh = convertGJtoKWh(consumptionGJ);
    
    totalGJ += consumptionGJ;
    totalCost += record.cost_brl || 0;
    
    if (record.is_renewable) {
      renewableGJ += consumptionGJ;
    } else {
      nonRenewableGJ += consumptionGJ;
    }

    // Classificar por fonte
    const sourceType = record.energy_source_type.toLowerCase();
    if (sourceType.includes('rede') || sourceType.includes('elétrica') || sourceType.includes('grid')) {
      bySource.grid += consumptionGJ;
    } else if (sourceType.includes('solar')) {
      bySource.solar += consumptionGJ;
    } else if (sourceType.includes('diesel')) {
      bySource.diesel += consumptionGJ;
    } else if (sourceType.includes('gasolina')) {
      bySource.gasoline += consumptionGJ;
    } else if (sourceType.includes('gás natural') || sourceType.includes('natural gas')) {
      bySource.natural_gas += consumptionGJ;
    } else if (sourceType.includes('biomassa')) {
      bySource.biomass += consumptionGJ;
    } else {
      bySource.other += consumptionGJ;
    }

    return {
      source_type: record.energy_source_type,
      source_name: record.energy_source_name || '',
      consumption_gj: consumptionGJ,
      consumption_kwh: consumptionKWh,
      cost_brl: record.cost_brl || 0,
      is_renewable: record.is_renewable
    };
  });

  // Calcular intensidade energética se houver dados de receita ou produção
  let energyIntensityPerRevenue: number | undefined;
  let energyIntensityPerUnit: number | undefined;

  const recordsWithRevenue = records.filter(r => r.revenue_brl && r.revenue_brl > 0);
  if (recordsWithRevenue.length > 0) {
    const totalRevenue = recordsWithRevenue.reduce((sum, r) => sum + (r.revenue_brl || 0), 0);
    if (totalRevenue > 0) {
      energyIntensityPerRevenue = totalGJ / totalRevenue;
    }
  }

  const recordsWithProduction = records.filter(r => r.production_volume && r.production_volume > 0);
  if (recordsWithProduction.length > 0) {
    const totalProduction = recordsWithProduction.reduce((sum, r) => sum + (r.production_volume || 0), 0);
    if (totalProduction > 0) {
      energyIntensityPerUnit = totalGJ / totalProduction;
    }
  }

  const renewablePercentage = totalGJ > 0 ? (renewableGJ / totalGJ) * 100 : 0;

  return {
    total_consumption_gj: totalGJ,
    total_consumption_kwh: convertGJtoKWh(totalGJ),
    total_cost_brl: totalCost,
    renewable_percentage: renewablePercentage,
    by_source: bySource,
    by_type: {
      renewable: renewableGJ,
      non_renewable: nonRenewableGJ
    },
    energy_intensity_gj_per_revenue: energyIntensityPerRevenue,
    energy_intensity_gj_per_unit: energyIntensityPerUnit,
    breakdown: breakdown
  };
};

/**
 * Buscar registros de energia
 */
export const getEnergyConsumptionRecords = async (
  year: number
): Promise<EnergyConsumptionRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const { data, error } = await supabase
    .from('energy_consumption_data')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('year', year)
    .order('period_start_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Deletar registro de energia
 */
export const deleteEnergyConsumptionRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('energy_consumption_data')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
