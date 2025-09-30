import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface EmissionSource {
  id: string;
  name: string;
  scope: number;
  category: string;
  subcategory?: string;
  description?: string;
  status: string;
  asset_id?: string;
  company_id: string;
  economic_sector?: string;
  scope_3_category_number?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEmissionSourceData {
  name: string;
  scope: number;
  category: string;
  subcategory?: string;
  description?: string;
  asset_id?: string;
  economic_sector?: string;
  scope_3_category_number?: number;
}

export interface ActivityData {
  emission_source_id: string;
  quantity: number;
  unit: string;
  period_start_date: string;
  period_end_date: string;
  source_document?: string;
  emission_factor_id?: string; // CORREÇÃO CRÍTICA: Permitir seleção específica de fator
  metadata?: any; // Support for additional data like GHG Protocol Brasil compliance
}

// Obter todas as fontes de emissão da empresa
export async function getEmissionSources(): Promise<EmissionSource[]> {
  const { data, error } = await supabase
    .from('emission_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fontes de emissão:', error);
    throw error;
  }

  return data || [];
}

// Criar nova fonte de emissão
export async function createEmissionSource(sourceData: CreateEmissionSourceData): Promise<EmissionSource> {
  // Get user company
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Perfil do usuário não encontrado');
  }

  const { data, error } = await supabase
    .from('emission_sources')
    .insert({
      ...sourceData,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar fonte de emissão:', error);
    throw error;
  }

  return data;
}

// Atualizar fonte de emissão
export async function updateEmissionSource(id: string, updateData: Partial<CreateEmissionSourceData>): Promise<EmissionSource> {
  const { data, error } = await supabase
    .from('emission_sources')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar fonte de emissão:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Fonte de emissão não encontrada');
  }

  return data;
}

// Deletar fonte de emissão
export async function deleteEmissionSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('emission_sources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar fonte de emissão:', error);
    throw error;
  }
}

export const updateActivityData = async (id: string, activityData: {
  emission_source_id?: string;
  quantity?: number;
  unit?: string;
  period_start_date?: string;
  period_end_date?: string;
  source_document?: string;
  emission_factor_id?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não encontrado');

  // Sanitize emission_factor_id: only use if it's a valid UUID
  const cleanedId = activityData.emission_factor_id && activityData.emission_factor_id.trim() !== '' 
    ? activityData.emission_factor_id 
    : undefined;

  // Prepare final activity data
  const finalActivityData = {
    ...activityData,
    emission_factor_id: cleanedId,
  };

  // If emission_factor_id is provided, get the correct unit from the factor
  if (cleanedId) {
    try {
      const { data: factor } = await supabase
        .from('emission_factors')
        .select('activity_unit')
        .eq('id', cleanedId)
        .maybeSingle();
      
      if (factor) {
        finalActivityData.unit = factor.activity_unit; // Override with factor's unit
        logger.info('Unidade sobrescrita pelo fator', { 
          component: 'emissions',
          metadata: { unit: factor.activity_unit } 
        });
      }
    } catch (error) {
      logger.warn('Erro ao buscar unidade do fator', { 
        component: 'emissions',
        metadata: { error } 
      });
    }
  }

  const { data, error } = await supabase
    .from('activity_data')
    .update(finalActivityData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar dados de atividade:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Dados de atividade não encontrados');
  }

  // Recalculate emissions automatically
  await calculateEmissionsForActivityData(data.id);
  
  return data;
};

export const addActivityData = async (activityData: {
  emission_source_id: string;
  quantity: number;
  unit: string;
  period_start_date: string;
  period_end_date: string;
  source_document?: string;
  emission_factor_id?: string;
  metadata?: any; // Add metadata support for GHG Protocol Brasil compliance
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não encontrado');

  // Sanitize emission_factor_id: only use if it's a valid UUID
  const cleanedId = activityData.emission_factor_id && activityData.emission_factor_id.trim() !== '' 
    ? activityData.emission_factor_id 
    : undefined;

  // Prepare final activity data
  const finalActivityData = {
    ...activityData,
    emission_factor_id: cleanedId,
    user_id: user.id
  };

  // If emission_factor_id is provided, get the correct unit from the factor
  if (cleanedId) {
    try {
      const { data: factor } = await supabase
        .from('emission_factors')
        .select('activity_unit')
        .eq('id', cleanedId)
        .maybeSingle();
      
      if (factor) {
        finalActivityData.unit = factor.activity_unit; // Override with factor's unit
        console.info('Unidade sobrescrita pelo fator:', factor.activity_unit);
      }
    } catch (error) {
      console.warn('Erro ao buscar unidade do fator:', error);
    }
  }

  const { data, error } = await supabase
    .from('activity_data')
    .insert(finalActivityData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao adicionar dados de atividade:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Erro ao criar dados de atividade');
  }

  // Calculate emissions automatically
  await calculateEmissionsForActivityData(data.id);
  
  return data;
};

async function calculateEmissionsForActivityData(activityDataId: string) {
  try {
    // Get the activity data
    const { data: activity } = await supabase
      .from('activity_data')
      .select('emission_factor_id, emission_source_id')
      .eq('id', activityDataId)
      .maybeSingle();

    if (activity?.emission_factor_id) {
      console.info('Calculando com fator específico:', activity.emission_factor_id);
      await calculateEmissions(activityDataId, activity.emission_factor_id);
    } else {
      console.info('Calculando automaticamente por unidade');
      await tryAutoCalculateEmissions(activityDataId, activity?.emission_source_id);
    }
  } catch (error) {
    console.error('Erro no cálculo de emissões:', error);
  }
}

async function tryAutoCalculateEmissions(activityDataId: string, emissionSourceId: string) {
  try {
    console.log('Tentando calcular emissões para activity:', activityDataId);
    
    // Buscar fonte de emissão para obter categoria
    const { data: source, error: sourceError } = await supabase
      .from('emission_sources')
      .select('category')
      .eq('id', emissionSourceId)
      .maybeSingle();

    if (sourceError || !source) {
      console.error('Erro ao buscar fonte de emissão:', sourceError);
      return;
    }

    console.log('Categoria da fonte:', source.category);

    // Mapeamento de categorias para compatibilidade
    const categoryMapping: Record<string, string[]> = {
      'Combustão Móvel': ['Fontes Móveis', 'Combustão Móvel'],
      'Fontes Móveis': ['Fontes Móveis', 'Combustão Móvel'],
      'Eletricidade Adquirida': ['Eletricidade Adquirida', 'Energia Adquirida'],
      'Energia Adquirida': ['Eletricidade Adquirida', 'Energia Adquirida'],
      'Combustão Estacionária': ['Combustão Estacionária'],
    };

    const searchCategories = categoryMapping[source.category] || [source.category];
    console.log('Buscando fatores para categorias:', searchCategories);

    // Buscar activity data para obter unidade
    const { data: activityData, error: activityError } = await supabase
      .from('activity_data')
      .select('unit, quantity')
      .eq('id', activityDataId)
      .maybeSingle();

    if (activityError || !activityData) {
      console.error('Erro ao buscar dados de atividade:', activityError);
      return;
    }

    console.log('Unidade da atividade:', activityData.unit);

    // Buscar fator de emissão compatível com melhor compatibilidade de unidades
    const { data: factors, error: factorsError } = await supabase
      .from('emission_factors')
      .select('*')
      .in('category', searchCategories);

    if (factorsError) {
      console.error('Erro ao buscar fatores:', factorsError);
      return;
    }

    console.log('Fatores encontrados:', factors?.length || 0);

    // Find compatible factor with improved unit matching
    const compatibleFactor = factors?.find(factor => {
      const factorUnit = factor.activity_unit.toLowerCase();
      const activityUnit = activityData.unit.toLowerCase();
      
      // Direct match
      if (factorUnit === activityUnit) return true;
      
      // Common unit conversions
      const unitEquivalents = {
        'litros': ['l', 'litro', 'liters'],
        'l': ['litros', 'litro', 'liters'],
        'kwh': ['kw.h', 'kw-h', 'quilowatt-hora'],
        'm³': ['m3', 'metros cúbicos', 'metro cúbico'],
        'm3': ['m³', 'metros cúbicos', 'metro cúbico'],
        'kg': ['quilograma', 'quilogramas', 'kilograma'],
        't': ['tonelada', 'toneladas', 'ton']
      };
      
      return unitEquivalents[factorUnit]?.includes(activityUnit) || 
             unitEquivalents[activityUnit]?.includes(factorUnit);
    });

    if (!compatibleFactor) {
      console.warn('Nenhum fator compatível encontrado para unidade:', activityData.unit);
      return;
    }

    console.log('Fator compatível encontrado:', compatibleFactor.name);

    // Calcular emissões automaticamente
    await calculateEmissions(activityDataId, compatibleFactor.id);
    console.log('Emissões calculadas com sucesso!');
  } catch (error) {
    console.error('Erro no cálculo automático:', error);
    // Não propagar erro para não afetar a inserção dos dados
  }
}

// Obter estatísticas de emissões
export async function getEmissionStats() {
  // Get total emissions by scope from calculated_emissions
  const { data: emissionsData, error: emissionsError } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      activity_data (
        emission_source_id,
        emission_sources (
          scope,
          status
        )
      )
    `);

  if (emissionsError) {
    console.error('Erro ao obter estatísticas de emissões:', emissionsError);
  }

  // Calculate totals by scope
  let totalEmissions = 0;
  let escopo1Emissions = 0;
  let escopo2Emissions = 0;
  let escopo3Emissions = 0;

  emissionsData?.forEach(emission => {
    const scope = emission.activity_data?.emission_sources?.scope;
    const co2e = emission.total_co2e || 0;
    
    totalEmissions += co2e;
    if (scope === 1) escopo1Emissions += co2e;
    else if (scope === 2) escopo2Emissions += co2e;
    else if (scope === 3) escopo3Emissions += co2e;
  });

  // Also get source counts for reference
  const { data: sources } = await supabase
    .from('emission_sources')
    .select('scope, status');

  const stats = {
    total: Math.round(totalEmissions * 100) / 100, // tCO2e
    escopo1: Math.round(escopo1Emissions * 100) / 100, // tCO2e
    escopo2: Math.round(escopo2Emissions * 100) / 100, // tCO2e
    escopo3: Math.round(escopo3Emissions * 100) / 100, // tCO2e
    ativas: sources?.filter(s => s.status === 'Ativo').length || 0, // count of active sources
    fontes_total: sources?.length || 0, // total count of sources
  };

  return stats;
}

// Obter fontes de emissão com últimas emissões calculadas
export async function getEmissionSourcesWithEmissions() {
  // First get emission sources
  const { data: sources, error: sourcesError } = await supabase
    .from('emission_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (sourcesError) {
    console.error('Erro ao buscar fontes de emissão:', sourcesError);
    throw sourcesError;
  }

  if (!sources) return [];

  // Get calculated emissions for each source
  const sourcesWithEmissions = await Promise.all(
    sources.map(async (source) => {
      // Get latest emission calculation for this source
      const { data: emissions } = await supabase
        .from('calculated_emissions')
        .select('total_co2e, calculation_date')
        .eq('activity_data_id', 
          await supabase
            .from('activity_data')
            .select('id')
            .eq('emission_source_id', source.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data }) => data?.[0]?.id)
        )
        .order('calculation_date', { ascending: false })
        .limit(1);

      const latestEmission = emissions?.[0];

      return {
        ...source,
        ultima_emissao: latestEmission?.total_co2e || 0,
        ultima_atualizacao: latestEmission?.calculation_date || source.updated_at,
      };
    })
  );

  return sourcesWithEmissions;
}

// Calculate emissions using simple direct formula: Emissions = Activity × Factor
export async function calculateEmissions(activityDataId: string, emissionFactorId: string) {
  try {
    console.log(`Calculating emissions for activity ${activityDataId} with factor ${emissionFactorId}`);
    
    // Fetch activity data and emission factor
    const [activityResponse, factorResponse] = await Promise.all([
      supabase
        .from('activity_data')
        .select('*')
        .eq('id', activityDataId)
        .single(),
      supabase
        .from('emission_factors')
        .select('*')
        .eq('id', emissionFactorId)
        .single()
    ]);

    if (activityResponse.error || factorResponse.error) {
      throw new Error('Error fetching data for calculation');
    }

    const activity = activityResponse.data;
    const factor = factorResponse.data;

    // Use database function for simple calculation
    const { data: result, error: calcError } = await supabase
      .rpc('calculate_simple_emissions', {
        p_activity_quantity: activity.quantity,
        p_activity_unit: activity.unit,
        p_factor_co2: factor.co2_factor || 0,
        p_factor_ch4: factor.ch4_factor || 0,
        p_factor_n2o: factor.n2o_factor || 0,
        p_factor_unit: factor.activity_unit
      });

    if (calcError) {
      throw new Error(`Calculation error: ${calcError.message}`);
    }

    // Cast result to proper type
    const calculationResult = result as {
      total_co2e_tonnes: number;
      co2_kg: number;
      ch4_kg: number;
      n2o_kg: number;
      conversion_factor_used: number;
      calculation_method: string;
    };

    // Save the calculated emissions
    const { error: saveError } = await supabase
      .from('calculated_emissions')
      .upsert({
        activity_data_id: activityDataId,
        emission_factor_id: emissionFactorId,
        total_co2e: calculationResult.total_co2e_tonnes,
        fossil_co2e: calculationResult.total_co2e_tonnes, // Assume all fossil for now
        biogenic_co2e: 0, // Can be enhanced later based on factor type
        details_json: {
          ...calculationResult,
          calculation_method: 'simple_direct_formula',
          factor_name: factor.name,
          activity_quantity: activity.quantity,
          activity_unit: activity.unit,
          factor_unit: factor.activity_unit
        }
      }, { 
        onConflict: 'activity_data_id'
      });

    if (saveError) {
      throw new Error(`Save error: ${saveError.message}`);
    }

    console.log(`Emissions calculated successfully: ${calculationResult.total_co2e_tonnes} tCO2e`);
    return {
      total_co2e: calculationResult.total_co2e_tonnes,
      details: calculationResult
    };
  } catch (error) {
    console.error('Error calculating emissions:', error);
    throw error;
  }
}

// Get emission factors suitable for a category
export async function getEmissionFactors(category?: string) {
  let query = supabase
    .from('emission_factors')
    .select('*')
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching emission factors:', error);
    throw error;
  }

  return data || [];
}