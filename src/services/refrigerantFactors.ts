import { supabase } from "@/integrations/supabase/client";

export interface RefrigerantFactor {
  id: string;
  refrigerant_code: string;
  chemical_name: string;
  chemical_formula?: string;
  gwp_ar6: number;
  gwp_ar5?: number;
  gwp_ar4?: number;
  category: string;
  source: string;
  is_kyoto_gas: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRefrigerantFactorData {
  refrigerant_code: string;
  chemical_name: string;
  chemical_formula?: string;
  gwp_ar6: number;
  gwp_ar5?: number;
  gwp_ar4?: number;
  category?: string;
  source?: string;
  is_kyoto_gas?: boolean;
}

// Obter todos os fatores de refrigerantes
export async function getRefrigerantFactors(): Promise<RefrigerantFactor[]> {
  const { data, error } = await supabase
    .from('refrigerant_factors')
    .select('*')
    .order('refrigerant_code', { ascending: true });

  if (error) {
    console.error('Erro ao buscar fatores de refrigerantes:', error);
    throw error;
  }

  return data || [];
}

// Obter fator de refrigerante por código
export async function getRefrigerantFactorByCode(code: string): Promise<RefrigerantFactor | null> {
  const { data, error } = await supabase
    .from('refrigerant_factors')
    .select('*')
    .eq('refrigerant_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erro ao buscar fator de refrigerante:', error);
    throw error;
  }

  return data;
}

// Criar fator de refrigerante
export async function createRefrigerantFactor(factorData: CreateRefrigerantFactorData): Promise<RefrigerantFactor> {
  const { data, error } = await supabase
    .from('refrigerant_factors')
    .insert({
      ...factorData,
      category: factorData.category || 'Emissões Fugitivas',
      source: factorData.source || 'GHG Protocol Brasil 2025.0.1',
      is_kyoto_gas: factorData.is_kyoto_gas || false
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar fator de refrigerante:', error);
    throw error;
  }

  return data;
}

// Importar fatores de refrigerantes em lote
export async function importRefrigerantFactors(
  factors: CreateRefrigerantFactorData[]
): Promise<{success: number; errors: number}> {
  let successCount = 0;
  let errorCount = 0;

  for (const factor of factors) {
    try {
      // Check if factor already exists
      const { data: existingFactor } = await supabase
        .from('refrigerant_factors')
        .select('id')
        .eq('refrigerant_code', factor.refrigerant_code)
        .single();

      if (existingFactor) {
        // Update existing factor
        await supabase
          .from('refrigerant_factors')
          .update({
            ...factor,
            category: factor.category || 'Emissões Fugitivas',
            source: factor.source || 'GHG Protocol Brasil 2025.0.1',
            is_kyoto_gas: factor.is_kyoto_gas || false
          })
          .eq('id', existingFactor.id);
      } else {
        // Insert new factor
        await supabase
          .from('refrigerant_factors')
          .insert({
            ...factor,
            category: factor.category || 'Emissões Fugitivas',
            source: factor.source || 'GHG Protocol Brasil 2025.0.1',
            is_kyoto_gas: factor.is_kyoto_gas || false
          });
      }
      successCount++;
    } catch (error) {
      console.error('Erro ao importar fator de refrigerante:', factor, error);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
}

// Obter refrigerantes não-Quioto
export async function getNonKyotoRefrigerants(): Promise<RefrigerantFactor[]> {
  const { data, error } = await supabase
    .from('refrigerant_factors')
    .select('*')
    .eq('is_kyoto_gas', false)
    .order('refrigerant_code', { ascending: true });

  if (error) {
    console.error('Erro ao buscar refrigerantes não-Quioto:', error);
    throw error;
  }

  return data || [];
}

// Calcular emissões de refrigerante
export async function calculateRefrigerantEmissions(
  refrigerantCode: string,
  massKg: number,
  gwpVersion: 'ar6' | 'ar5' | 'ar4' = 'ar6'
): Promise<number> {
  const factor = await getRefrigerantFactorByCode(refrigerantCode);
  
  if (!factor) {
    throw new Error(`Fator não encontrado para refrigerante: ${refrigerantCode}`);
  }

  let gwp: number;
  switch (gwpVersion) {
    case 'ar5':
      gwp = factor.gwp_ar5 || factor.gwp_ar6;
      break;
    case 'ar4':
      gwp = factor.gwp_ar4 || factor.gwp_ar6;
      break;
    default:
      gwp = factor.gwp_ar6;
  }

  // Retorna emissões em kg CO2e
  return massKg * gwp;
}