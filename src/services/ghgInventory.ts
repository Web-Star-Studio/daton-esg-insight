import { supabase } from '@/integrations/supabase/client';

export interface GHGInventorySummary {
  id?: string;
  company_id: string;
  inventory_year: number;
  base_year?: number;
  reporting_period_start: string;
  reporting_period_end: string;
  
  scope_1_total: number;
  scope_2_total: number;
  scope_3_total: number;
  total_emissions: number;
  biogenic_emissions: number;
  
  methodology?: string;
  ghg_protocol_seal?: string | null;
  is_third_party_verified?: boolean;
  verification_body?: string;
  verification_date?: string;
  
  [key: string]: any;
}

export interface EmissionsByScope {
  scope_1: {
    total: number;
    stationary_combustion: number;
    mobile_combustion: number;
    fugitive_emissions: number;
    industrial_processes: number;
    agriculture: number;
    sources: Array<{ name: string; emissions: number; category: string }>;
  };
  scope_2: {
    total: number;
    electricity_location: number;
    electricity_market: number;
    heat_steam: number;
    cooling: number;
    sources: Array<{ name: string; emissions: number; category: string }>;
  };
  scope_3: {
    total: number;
    by_category: Record<number, { name: string; emissions: number }>;
    sources: Array<{ name: string; emissions: number; category: string; category_number?: number }>;
  };
  biogenic: {
    total: number;
    sources: Array<{ name: string; emissions: number }>;
  };
  grand_total: number;
  calculation_date: string;
}

/**
 * Calcula emissões totais de GEE por escopo
 */
export const calculateTotalGHGEmissions = async (
  year: number,
  companyId?: string
): Promise<EmissionsByScope> => {
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
  
  const { data: emissions, error } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      biogenic_co2_kg,
      is_biogenic_source,
      activity_data!inner(
        emission_source_id,
        period_start_date,
        period_end_date,
        emission_sources!inner(
          id,
          name,
          scope,
          category,
          subcategory,
          scope_3_category_number,
          company_id
        )
      )
    `)
    .gte('activity_data.period_start_date', `${year}-01-01`)
    .lte('activity_data.period_end_date', `${year}-12-31`)
    .eq('activity_data.emission_sources.company_id', targetCompanyId);
  
  if (error) throw error;
  
  const result: EmissionsByScope = {
    scope_1: {
      total: 0,
      stationary_combustion: 0,
      mobile_combustion: 0,
      fugitive_emissions: 0,
      industrial_processes: 0,
      agriculture: 0,
      sources: []
    },
    scope_2: {
      total: 0,
      electricity_location: 0,
      electricity_market: 0,
      heat_steam: 0,
      cooling: 0,
      sources: []
    },
    scope_3: {
      total: 0,
      by_category: {},
      sources: []
    },
    biogenic: {
      total: 0,
      sources: []
    },
    grand_total: 0,
    calculation_date: new Date().toISOString()
  };
  
  const scope1CategoryMap: Record<string, 'stationary_combustion' | 'mobile_combustion' | 'fugitive_emissions' | 'industrial_processes' | 'agriculture'> = {
    'Combustão Estacionária': 'stationary_combustion',
    'Combustão Móvel': 'mobile_combustion',
    'Fontes Móveis': 'mobile_combustion',
    'Emissões Fugitivas': 'fugitive_emissions',
    'Processos Industriais': 'industrial_processes',
    'Agricultura': 'agriculture'
  };
  
  const sourceAggregation: Record<string, { 
    name: string; 
    scope: number; 
    category: string; 
    emissions: number; 
    biogenic: number; 
    category_number?: number;
  }> = {};
  
  emissions?.forEach(emission => {
    const source = emission.activity_data?.emission_sources;
    if (!source) return;
    
    const co2e = emission.total_co2e || 0;
    const biogenic = emission.biogenic_co2_kg || 0;
    
    if (!sourceAggregation[source.id]) {
      sourceAggregation[source.id] = {
        name: source.name,
        scope: source.scope,
        category: source.category,
        emissions: 0,
        biogenic: 0,
        category_number: source.scope_3_category_number
      };
    }
    
    sourceAggregation[source.id].emissions += co2e;
    sourceAggregation[source.id].biogenic += biogenic / 1000;
    
    switch (source.scope) {
      case 1:
        result.scope_1.total += co2e;
        const scope1Key = scope1CategoryMap[source.category];
        if (scope1Key) {
          result.scope_1[scope1Key] += co2e;
        }
        break;
        
      case 2:
        result.scope_2.total += co2e;
        if (source.category.toLowerCase().includes('eletricidade') || 
            source.category.toLowerCase().includes('energia adquirida')) {
          result.scope_2.electricity_location += co2e;
        } else if (source.category.toLowerCase().includes('vapor') || 
                   source.category.toLowerCase().includes('aquecimento')) {
          result.scope_2.heat_steam += co2e;
        } else if (source.category.toLowerCase().includes('refrigeração')) {
          result.scope_2.cooling += co2e;
        }
        break;
        
      case 3:
        result.scope_3.total += co2e;
        const categoryNum = source.scope_3_category_number || 0;
        if (!result.scope_3.by_category[categoryNum]) {
          result.scope_3.by_category[categoryNum] = {
            name: source.category,
            emissions: 0
          };
        }
        result.scope_3.by_category[categoryNum].emissions += co2e;
        break;
    }
    
    if (biogenic > 0) {
      result.biogenic.total += biogenic / 1000;
    }
  });
  
  Object.values(sourceAggregation).forEach(source => {
    const sourceData = {
      name: source.name,
      emissions: Math.round(source.emissions * 1000) / 1000,
      category: source.category
    };
    
    if (source.scope === 1) {
      result.scope_1.sources.push(sourceData);
    } else if (source.scope === 2) {
      result.scope_2.sources.push(sourceData);
    } else if (source.scope === 3) {
      result.scope_3.sources.push({
        ...sourceData,
        category_number: source.category_number
      });
    }
    
    if (source.biogenic > 0) {
      result.biogenic.sources.push({
        name: source.name,
        emissions: Math.round(source.biogenic * 1000) / 1000
      });
    }
  });
  
  result.scope_1.total = Math.round(result.scope_1.total * 1000) / 1000;
  result.scope_2.total = Math.round(result.scope_2.total * 1000) / 1000;
  result.scope_3.total = Math.round(result.scope_3.total * 1000) / 1000;
  result.biogenic.total = Math.round(result.biogenic.total * 1000) / 1000;
  result.grand_total = Math.round((result.scope_1.total + result.scope_2.total + result.scope_3.total) * 1000) / 1000;
  
  return result;
};

/**
 * Salvar ou atualizar resumo do inventário GEE
 */
export const saveGHGInventorySummary = async (
  summary: GHGInventorySummary
): Promise<GHGInventorySummary> => {
  const { data, error } = await supabase
    .from('ghg_inventory_summary')
    .upsert(summary, {
      onConflict: 'company_id,inventory_year'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Gerar automaticamente resumo do inventário
 */
export const generateInventorySummary = async (
  year: number
): Promise<GHGInventorySummary> => {
  const emissionsData = await calculateTotalGHGEmissions(year);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  
  const summary: GHGInventorySummary = {
    company_id: profile.company_id,
    inventory_year: year,
    reporting_period_start: `${year}-01-01`,
    reporting_period_end: `${year}-12-31`,
    
    scope_1_total: emissionsData.scope_1.total,
    scope_2_total: emissionsData.scope_2.total,
    scope_3_total: emissionsData.scope_3.total,
    total_emissions: emissionsData.grand_total,
    biogenic_emissions: emissionsData.biogenic.total,
    
    scope_1_stationary_combustion: emissionsData.scope_1.stationary_combustion,
    scope_1_mobile_combustion: emissionsData.scope_1.mobile_combustion,
    scope_1_fugitive_emissions: emissionsData.scope_1.fugitive_emissions,
    scope_1_industrial_processes: emissionsData.scope_1.industrial_processes,
    scope_1_agriculture: emissionsData.scope_1.agriculture,
    
    scope_2_electricity_location: emissionsData.scope_2.electricity_location,
    scope_2_heat_steam: emissionsData.scope_2.heat_steam,
    scope_2_cooling: emissionsData.scope_2.cooling,
    
    methodology: 'GHG Protocol',
    calculation_method: 'Cálculo direto com fatores de emissão IPCC/GHG Protocol Brasil'
  };
  
  Object.entries(emissionsData.scope_3.by_category).forEach(([catNum, catData]) => {
    const num = parseInt(catNum);
    if (num === 1) summary.scope_3_purchased_goods = catData.emissions;
    else if (num === 2) summary.scope_3_capital_goods = catData.emissions;
    else if (num === 3) summary.scope_3_fuel_energy = catData.emissions;
    else if (num === 4) summary.scope_3_upstream_transport = catData.emissions;
    else if (num === 5) summary.scope_3_waste = catData.emissions;
    else if (num === 6) summary.scope_3_business_travel = catData.emissions;
    else if (num === 7) summary.scope_3_employee_commuting = catData.emissions;
    else if (num === 8) summary.scope_3_leased_assets = catData.emissions;
    else if (num === 9) summary.scope_3_downstream_transport = catData.emissions;
    else if (num === 11) summary.scope_3_product_use = catData.emissions;
    else if (num === 12) summary.scope_3_end_of_life = catData.emissions;
    else summary.scope_3_other = (summary.scope_3_other || 0) + catData.emissions;
  });
  
  return await saveGHGInventorySummary(summary);
};

/**
 * Buscar resumos de inventário
 */
export const getGHGInventorySummaries = async (): Promise<GHGInventorySummary[]> => {
  const { data, error } = await supabase
    .from('ghg_inventory_summary')
    .select('*')
    .order('inventory_year', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Buscar resumo de um ano específico
 */
export const getGHGInventorySummary = async (year: number): Promise<GHGInventorySummary | null> => {
  const { data, error } = await supabase
    .from('ghg_inventory_summary')
    .select('*')
    .eq('inventory_year', year)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};
