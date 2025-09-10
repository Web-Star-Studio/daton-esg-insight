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

  const { error } = await supabase
    .from('activity_data')
    .insert({
      ...activityData,
      user_id: user.id,
    });

  if (error) {
    console.error('Erro ao adicionar dados de atividade:', error);
    throw error;
  }
}

// Obter estatísticas de emissões
export async function getEmissionStats() {
  const { data: sources, error: sourcesError } = await supabase
    .from('emission_sources')
    .select('scope, status');

  if (sourcesError) {
    console.error('Erro ao obter estatísticas:', sourcesError);
    throw sourcesError;
  }

  const stats = {
    total: sources?.length || 0,
    escopo1: sources?.filter(s => s.scope === 1).length || 0,
    escopo2: sources?.filter(s => s.scope === 2).length || 0,
    escopo3: sources?.filter(s => s.scope === 3).length || 0,
    ativas: sources?.filter(s => s.status === 'Ativo').length || 0,
  };

  return stats;
}

// Obter fontes de emissão com últimas emissões calculadas
export async function getEmissionSourcesWithEmissions() {
  const { data, error } = await supabase
    .from('emission_sources')
    .select(`
      *,
      calculated_emissions(
        total_co2e,
        calculation_date
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fontes com emissões:', error);
    throw error;
  }

  return data?.map(source => ({
    ...source,
    ultima_emissao: Array.isArray(source.calculated_emissions) && source.calculated_emissions.length > 0 
      ? source.calculated_emissions[0].total_co2e 
      : 0,
    ultima_atualizacao: Array.isArray(source.calculated_emissions) && source.calculated_emissions.length > 0
      ? source.calculated_emissions[0].calculation_date 
      : source.updated_at,
  })) || [];
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