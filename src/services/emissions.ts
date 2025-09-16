import { supabase } from "@/integrations/supabase/client";

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
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
    .single();

  if (error) {
    console.error('Erro ao atualizar fonte de emissão:', error);
    throw error;
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

// Adicionar dados de atividade
export async function addActivityData(activityData: ActivityData): Promise<void> {
  // Get user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: activityRecord, error: activityError } = await supabase
    .from('activity_data')
    .insert({
      ...activityData,
      user_id: user.id,
    })
    .select()
    .single();

  if (activityError) {
    console.error('Erro ao adicionar dados de atividade:', activityError);
    throw activityError;
  }

  // Após inserir activity_data, calcular emissões com fator específico ou automático
  if (activityData.emission_factor_id) {
    // CORREÇÃO CRÍTICA: Usar fator específico selecionado pelo usuário
    await calculateEmissions(activityRecord.id, activityData.emission_factor_id);
  } else {
    // Fallback: tentar calcular automaticamente (comportamento anterior)
    await tryAutoCalculateEmissions(activityRecord.id, activityData.emission_source_id);
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
      .single();

    if (sourceError) {
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
      .single();

    if (activityError) {
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

// Calculate emissions for activity data with GHG Protocol compliance
export async function calculateEmissions(activityDataId: string, emissionFactorId: string) {
  try {
    // Fetch activity data and emission factor
    const [activityResponse, factorResponse, sourceResponse] = await Promise.all([
      supabase
        .from('activity_data')
        .select('*')
        .eq('id', activityDataId)
        .single(),
      supabase
        .from('emission_factors')
        .select('*')
        .eq('id', emissionFactorId)
        .single(),
      supabase
        .from('activity_data')
        .select(`
          emission_sources (
            category,
            economic_sector
          )
        `)
        .eq('id', activityDataId)
        .single()
    ]);

    if (activityResponse.error || factorResponse.error || sourceResponse.error) {
      throw new Error('Error fetching data for calculation');
    }

    const activity = activityResponse.data;
    const factor = factorResponse.data;
    const source = sourceResponse.data.emission_sources;

    // For stationary combustion, use enhanced calculation
    if (source?.category === 'Combustão Estacionária') {
      const { calculateStationaryCombustionEmissions } = await import('./stationaryCombustion');
      
      const economicSector = source.economic_sector as any || 'Industrial';
      
      const result = await calculateStationaryCombustionEmissions(
        factor.name,
        activity.quantity,
        activity.unit,
        economicSector
      );

      // Store calculated emissions with fossil/biogenic separation
      const { data: calculatedEmission, error: insertError } = await supabase
        .from('calculated_emissions')
        .upsert({
          activity_data_id: activityDataId,
          emission_factor_id: emissionFactorId,
          total_co2e: result.total_co2e,
          fossil_co2e: result.fossil_co2e,
          biogenic_co2e: result.biogenic_co2e,
          details_json: result.calculation_details
        }, {
          onConflict: 'activity_data_id'
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return calculatedEmission;
    }

    // Standard calculation for other categories
    let co2_emissions = activity.quantity * (factor.co2_factor || 0);
    let ch4_emissions = activity.quantity * (factor.ch4_factor || 0);  
    let n2o_emissions = activity.quantity * (factor.n2o_factor || 0);

    // Apply unit conversions if needed
    const { getConversionFactor } = await import('./conversionFactors');
    
    if (activity.unit !== factor.activity_unit) {
      const conversionFactor = await getConversionFactor(
        activity.unit, 
        factor.activity_unit, 
        source?.category
      );
      const convertedQuantity = activity.quantity * conversionFactor;
      
      co2_emissions = convertedQuantity * (factor.co2_factor || 0);
      ch4_emissions = convertedQuantity * (factor.ch4_factor || 0);
      n2o_emissions = convertedQuantity * (factor.n2o_factor || 0);
    }

    // GWP factors IPCC AR6
    const gwpCH4 = factor.is_biofuel ? 27 : 30; // Different for fossil vs biogenic
    const gwpN2O = 273;
    
    // CO2 equivalent calculation
    const ch4_co2e = ch4_emissions * gwpCH4;
    const n2o_co2e = n2o_emissions * gwpN2O;
    
    // Fossil vs biogenic separation
    const biogenic_fraction = factor.biogenic_fraction || 0;
    const fossil_fraction = 1 - biogenic_fraction;
    
    const fossil_co2e = (co2_emissions * fossil_fraction) + ch4_co2e + n2o_co2e;
    const biogenic_co2e = co2_emissions * biogenic_fraction;
    const total_co2e = fossil_co2e + biogenic_co2e;

    // Store calculated emissions
    const { data: calculatedEmission, error: insertError } = await supabase
      .from('calculated_emissions')
      .upsert({
        activity_data_id: activityDataId,
        emission_factor_id: emissionFactorId,
        total_co2e,
        fossil_co2e,
        biogenic_co2e,
        details_json: {
          co2_emissions,
          ch4_emissions,
          n2o_emissions,
          ch4_co2e,
          n2o_co2e,
          biogenic_fraction,
          fossil_fraction,
          calculation_method: 'ghg_protocol_2025',
          gwp_factors: { ch4: gwpCH4, n2o: gwpN2O },
          conversion_applied: activity.unit !== factor.activity_unit
        }
      }, {
        onConflict: 'activity_data_id'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return calculatedEmission;
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