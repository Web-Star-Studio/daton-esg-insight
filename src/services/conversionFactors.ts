import { supabase } from "@/integrations/supabase/client";

export interface ConversionFactor {
  id: string;
  from_unit: string;
  to_unit: string;
  conversion_factor: number;
  category: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversionFactorData {
  from_unit: string;
  to_unit: string;
  conversion_factor: number;
  category: string;
  source?: string;
}

// Obter todos os fatores de conversão
export async function getConversionFactors(): Promise<ConversionFactor[]> {
  const { data, error } = await supabase
    .from('conversion_factors')
    .select('*')
    .order('category', { ascending: true })
    .order('from_unit', { ascending: true });

  if (error) {
    console.error('Erro ao buscar fatores de conversão:', error);
    throw error;
  }

  return data || [];
}

// Obter fatores por categoria
export async function getConversionFactorsByCategory(category: string): Promise<ConversionFactor[]> {
  const { data, error } = await supabase
    .from('conversion_factors')
    .select('*')
    .eq('category', category)
    .order('from_unit', { ascending: true });

  if (error) {
    console.error('Erro ao buscar fatores de conversão por categoria:', error);
    throw error;
  }

  return data || [];
}

// Buscar fator de conversão específico
export async function getConversionFactor(
  fromUnit: string, 
  toUnit: string, 
  category?: string
): Promise<number> {
  let query = supabase
    .from('conversion_factors')
    .select('conversion_factor')
    .eq('from_unit', fromUnit)
    .eq('to_unit', toUnit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Erro ao buscar fator de conversão:', error);
    throw new Error(`Erro ao buscar fator de conversão: ${error.message}`);
  }
  
  if (!data) {
    return 1.0; // Fator padrão quando não encontrado
  }

  return data?.conversion_factor || 1.0;
}

// Criar fator de conversão
export async function createConversionFactor(factorData: CreateConversionFactorData): Promise<ConversionFactor> {
  const { data, error } = await supabase
    .from('conversion_factors')
    .insert({
      ...factorData,
      source: factorData.source || 'GHG Protocol Brasil 2025.0.1'
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar fator de conversão:', error);
    throw new Error(`Erro ao criar fator de conversão: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Não foi possível criar o fator de conversão');
  }

  return data;
}

// Importar fatores de conversão em lote
export async function importConversionFactors(
  factors: CreateConversionFactorData[]
): Promise<{success: number; errors: number}> {
  let successCount = 0;
  let errorCount = 0;

  for (const factor of factors) {
    try {
      // Check if factor already exists
      const { data: existingFactor } = await supabase
        .from('conversion_factors')
        .select('id')
        .eq('from_unit', factor.from_unit)
        .eq('to_unit', factor.to_unit)
        .eq('category', factor.category)
        .maybeSingle();

      if (existingFactor) {
        // Update existing factor
        await supabase
          .from('conversion_factors')
          .update({
            conversion_factor: factor.conversion_factor,
            source: factor.source || 'GHG Protocol Brasil 2025.0.1'
          })
          .eq('id', existingFactor.id);
      } else {
        // Insert new factor
        await supabase
          .from('conversion_factors')
          .insert({
            ...factor,
            source: factor.source || 'GHG Protocol Brasil 2025.0.1'
          });
      }
      successCount++;
    } catch (error) {
      console.error('Erro ao importar fator:', factor, error);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
}

// Obter categorias de conversão disponíveis
export async function getConversionCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('conversion_factors')
    .select('category')
    .order('category', { ascending: true });

  if (error) {
    console.error('Erro ao buscar categorias de conversão:', error);
    throw error;
  }

  // Remover duplicatas
  const categories = [...new Set(data.map(item => item.category))];
  return categories;
}