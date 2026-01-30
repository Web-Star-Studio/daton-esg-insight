import { supabase } from "@/integrations/supabase/client";
import { calculateAdjustedFuelFactor, getElectricityFactorSIN } from "./variableFactors";
import { getConversionFactor } from "./conversionFactors";
import { logger } from "@/utils/logger";
import type { Json } from "@/integrations/supabase/types";

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  activity_unit: string;
  co2_factor: number | null;
  ch4_factor: number | null;
  n2o_factor: number | null;
  source: string;
  year_of_validity: number | null;
  type: 'system' | 'custom';
  company_id: string | null;
  created_at: string;
  validation_status?: string;
  details_json?: Json;
}

export interface CreateEmissionFactorData {
  name: string;
  category: string;
  activity_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  source: string;
  year_of_validity?: number;
  details_json?: Json;
}

// Obter todos os fatores de emissão (sistema + customizados da empresa)
export async function getEmissionFactors(): Promise<EmissionFactor[]> {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    logger.error('Erro ao buscar fatores de emissão', error, 'emission');
    throw error;
  }

  return data || [];
}

// Obter fatores por categoria
export async function getEmissionFactorsByCategory(category: string): Promise<EmissionFactor[]> {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Erro ao buscar fatores por categoria', error, 'emission');
    throw error;
  }

  return data || [];
}

// Criar fator de emissão customizado
export async function createCustomEmissionFactor(factorData: CreateEmissionFactorData): Promise<EmissionFactor> {
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
    .from('emission_factors')
    .insert({
      ...factorData,
      type: 'custom',
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao criar fator de emissão', error, 'emission');
    throw error;
  }

  return data;
}

// Atualizar fator de emissão customizado
export async function updateCustomEmissionFactor(id: string, updateData: Partial<CreateEmissionFactorData>): Promise<EmissionFactor> {
  const { data, error } = await supabase
    .from('emission_factors')
    .update(updateData)
    .eq('id', id)
    .eq('type', 'custom') // Só permite editar fatores customizados
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Erro ao atualizar fator de emissão', error, 'emission');
    throw error;
  }

  if (!data) {
    throw new Error('Fator de emissão não encontrado ou não é customizado');
  }

  return data;
}

// Deletar fator de emissão customizado
export async function deleteCustomEmissionFactor(id: string): Promise<void> {
  const { error } = await supabase
    .from('emission_factors')
    .delete()
    .eq('id', id)
    .eq('type', 'custom'); // Só permite deletar fatores customizados

  if (error) {
    logger.error('Erro ao deletar fator de emissão', error, 'emission');
    throw error;
  }
}

// Obter categorias disponíveis
export async function getEmissionCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('category')
    .order('category');

  if (error) {
    logger.error('Erro ao buscar categorias', error, 'emission');
    throw error;
  }

  // Remove duplicates
  const categories = [...new Set(data?.map(item => item.category) || [])];
  return categories;
}

// Recalcular emissões para dados existentes
export async function recalculateExistingEmissions(): Promise<void> {
  try {
    logger.info('Iniciando recálculo de emissões existentes...', 'emission');
    
    // Get all activity data that doesn't have calculated emissions
    const { data: activityData, error: activityError } = await supabase
      .from('activity_data')
      .select(`
        id,
        emission_source_id,
        emission_sources (
          category
        )
      `);

    if (activityError) {
      logger.error('Erro ao buscar dados de atividade', activityError, 'emission');
      return;
    }

    if (!activityData?.length) {
      logger.debug('Nenhum dado de atividade encontrado', 'emission');
      return;
    }

    let calculatedCount = 0;

    for (const activity of activityData) {
      try {
        // Check if already has calculated emissions
        const { data: existingCalculation } = await supabase
          .from('calculated_emissions')
          .select('id')
          .eq('activity_data_id', activity.id)
          .limit(1);

        if (existingCalculation?.length) {
          logger.debug(`Activity ${activity.id} já tem emissões calculadas`, 'emission');
          continue;
        }

        const category = activity.emission_sources?.category;
        if (!category) continue;

        // Mapeamento de categorias
        const categoryMapping: Record<string, string[]> = {
          'Combustão Móvel': ['Fontes Móveis', 'Combustão Móvel'],
          'Fontes Móveis': ['Fontes Móveis', 'Combustão Móvel'],
          'Eletricidade Adquirida': ['Eletricidade Adquirida', 'Energia Adquirida'],
          'Energia Adquirida': ['Eletricidade Adquirida', 'Energia Adquirida'],
          'Combustão Estacionária': ['Combustão Estacionária'],
        };

        const searchCategories = categoryMapping[category] || [category];

        // Find compatible emission factor
        const { data: factors } = await supabase
          .from('emission_factors')
          .select('*')
          .in('category', searchCategories)
          .limit(1);

        if (!factors?.length) {
          logger.warn(`Nenhum fator encontrado para categoria: ${category}`, 'emission');
          continue;
        }

        // Calculate emissions
        const { calculateEmissions } = await import('./emissions');
        await calculateEmissions(activity.id, factors[0].id);
        calculatedCount++;
        
        logger.debug(`Emissões calculadas para activity ${activity.id}`, 'emission');
        
      } catch (error) {
        logger.error(`Erro ao calcular emissões para activity ${activity.id}`, error, 'emission');
      }
    }

    logger.info(`Recálculo concluído. ${calculatedCount} emissões calculadas.`, 'emission');
    
  } catch (error) {
    logger.error('Erro no recálculo de emissões', error, 'emission');
  }
}
