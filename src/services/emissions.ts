import { supabase } from "@/integrations/supabase/client";

export interface EmissionSource {
  id: string;
  name: string;
  scope: number;
  category: string;
  description?: string;
  status: string;
  asset_id?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmissionSourceData {
  name: string;
  scope: number;
  category: string;
  description?: string;
  asset_id?: string;
}

export interface ActivityData {
  emission_source_id: string;
  quantity: number;
  unit: string;
  period_start_date: string;
  period_end_date: string;
  source_document?: string;
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

  // Após inserir activity_data, tentar calcular emissões automaticamente
  await tryAutoCalculateEmissions(activityRecord.id, activityData.emission_source_id);
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

    // Buscar fator de emissão compatível
    const { data: factors, error: factorsError } = await supabase
      .from('emission_factors')
      .select('*')
      .in('category', searchCategories)
      .limit(1);

    if (factorsError) {
      console.error('Erro ao buscar fatores:', factorsError);
      return;
    }

    if (!factors?.length) {
      console.warn('Nenhum fator encontrado para categorias:', searchCategories);
      return;
    }

    console.log('Fator encontrado:', factors[0].name);

    // Calcular emissões automaticamente
    await calculateEmissions(activityDataId, factors[0].id);
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

// Calculate emissions for activity data
export async function calculateEmissions(activityDataId: string, emissionFactorId: string) {
  try {
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

    // Calculate emissions (quantity * emission factors)
    const co2_emissions = activity.quantity * (factor.co2_factor || 0);
    const ch4_emissions = activity.quantity * (factor.ch4_factor || 0);
    const n2o_emissions = activity.quantity * (factor.n2o_factor || 0);
    
    // Total CO2 equivalent (assuming GWP: CH4=25, N2O=298)
    const total_co2e = co2_emissions + (ch4_emissions * 25) + (n2o_emissions * 298);

    // Store calculated emissions
    const { data: calculatedEmission, error: insertError } = await supabase
      .from('calculated_emissions')
      .insert({
        activity_data_id: activityDataId,
        emission_factor_id: emissionFactorId,
        total_co2e,
        details_json: {
          co2_emissions,
          ch4_emissions,
          n2o_emissions,
          calculation_method: 'simple_multiplication',
          gwp_factors: { ch4: 25, n2o: 298 }
        }
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