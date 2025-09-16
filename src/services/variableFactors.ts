import { supabase } from "@/integrations/supabase/client";

export interface VariableFactors {
  id: string;
  year: number;
  month: number;
  biodiesel_percentage: number;
  ethanol_percentage: number;
  electricity_sin_factor: number | null;
  created_at: string;
  updated_at: string;
}

// Obter fatores variáveis para um período específico
export async function getVariableFactors(year?: number, month?: number): Promise<VariableFactors[]> {
  let query = supabase
    .from('variable_factors')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (year) {
    query = query.eq('year', year);
  }

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar fatores variáveis:', error);
    throw error;
  }

  return data || [];
}

// Obter fator específico para uma data
export async function getVariableFactorForDate(date: Date): Promise<VariableFactors | null> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const { data, error } = await supabase
    .from('variable_factors')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado, retornar null
      return null;
    }
    console.error('Erro ao buscar fator variável:', error);
    throw error;
  }

  return data;
}

// Calcular fator de combustível ajustado com biodiesel/etanol
export async function calculateAdjustedFuelFactor(
  baseFactor: number,
  fuelType: 'diesel' | 'gasoline',
  consumptionDate: Date
): Promise<number> {
  const variableFactor = await getVariableFactorForDate(consumptionDate);
  
  if (!variableFactor) {
    // Se não há dados para o período, usar valores padrão
    const defaultBiodiesel = 12.0;
    const defaultEthanol = 27.0;
    
    if (fuelType === 'diesel') {
      // Fator diesel comercial = fator diesel puro × (1 - % biodiesel)
      return baseFactor * (1 - defaultBiodiesel / 100);
    } else if (fuelType === 'gasoline') {
      // Fator gasolina comercial = fator gasolina pura × (1 - % etanol) 
      return baseFactor * (1 - defaultEthanol / 100);
    }
  }

  if (fuelType === 'diesel') {
    return baseFactor * (1 - variableFactor.biodiesel_percentage / 100);
  } else if (fuelType === 'gasoline') {
    return baseFactor * (1 - variableFactor.ethanol_percentage / 100);
  }

  return baseFactor;
}

// Obter fator de eletricidade do SIN para um período
export async function getElectricityFactorSIN(date: Date): Promise<number> {
  const variableFactor = await getVariableFactorForDate(date);
  
  // Fator padrão caso não haja dados específicos (média anual aproximada)
  const defaultElectricityFactor = 0.0805; // kg CO2/kWh
  
  return variableFactor?.electricity_sin_factor || defaultElectricityFactor;
}

// Inserir ou atualizar fatores variáveis
export async function upsertVariableFactors(factors: Omit<VariableFactors, 'id' | 'created_at' | 'updated_at'>): Promise<VariableFactors> {
  // Check if factor already exists
  const { data: existingFactor } = await supabase
    .from('variable_factors')
    .select('*')
    .eq('year', factors.year)
    .eq('month', factors.month)
    .single();

  let data, error;
  if (existingFactor) {
    // Update existing factor
    const result = await supabase
      .from('variable_factors')
      .update(factors)
      .eq('id', existingFactor.id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Insert new factor
    const result = await supabase
      .from('variable_factors')
      .insert(factors)
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Erro ao inserir/atualizar fatores variáveis:', error);
    throw error;
  }

  return data;
}

// Obter anos disponíveis
export async function getAvailableYears(): Promise<number[]> {
  const { data, error } = await supabase
    .from('variable_factors')
    .select('year')
    .order('year', { ascending: false });

  if (error) {
    console.error('Erro ao buscar anos disponíveis:', error);
    throw error;
  }

  // Remover duplicatas
  const years = [...new Set(data.map(item => item.year))];
  return years;
}

// Importar dados de fatores variáveis de uma fonte externa (exemplo: spreadsheet)
export async function importVariableFactors(data: Array<{
  year: number;
  month: number;
  biodiesel_percentage: number;
  ethanol_percentage: number;
  electricity_sin_factor?: number | null;
}>): Promise<{success: number; errors: number}> {
  let successCount = 0;
  let errorCount = 0;

  for (const factorData of data) {
    try {
      await upsertVariableFactors({
        ...factorData,
        electricity_sin_factor: factorData.electricity_sin_factor || null
      });
      successCount++;
    } catch (error) {
      console.error('Erro ao importar fator:', factorData, error);
      errorCount++;
    }
  }

  return {
    success: successCount,
    errors: errorCount
  };
}

// Validar se os fatores estão dentro dos ranges esperados
export function validateVariableFactors(factors: Partial<VariableFactors>): string[] {
  const errors: string[] = [];

  if (factors.biodiesel_percentage !== undefined) {
    if (factors.biodiesel_percentage < 0 || factors.biodiesel_percentage > 100) {
      errors.push('Percentual de biodiesel deve estar entre 0% e 100%');
    }
  }

  if (factors.ethanol_percentage !== undefined) {
    if (factors.ethanol_percentage < 0 || factors.ethanol_percentage > 100) {
      errors.push('Percentual de etanol deve estar entre 0% e 100%');
    }
  }

  if (factors.electricity_sin_factor !== undefined) {
    if (factors.electricity_sin_factor < 0 || factors.electricity_sin_factor > 1) {
      errors.push('Fator de eletricidade SIN deve estar entre 0 e 1 kg CO2/kWh');
    }
  }

  if (factors.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (factors.year < 2000 || factors.year > currentYear + 5) {
      errors.push(`Ano deve estar entre 2000 e ${currentYear + 5}`);
    }
  }

  if (factors.month !== undefined) {
    if (factors.month < 1 || factors.month > 12) {
      errors.push('Mês deve estar entre 1 e 12');
    }
  }

  return errors;
}

// Obter estatísticas dos fatores variáveis
export async function getVariableFactorsStats() {
  const { data, error } = await supabase
    .from('variable_factors')
    .select('*');

  if (error) throw error;

  const stats = {
    total_records: data.length,
    years_covered: [...new Set(data.map(item => item.year))].length,
    avg_biodiesel: data.reduce((sum, item) => sum + item.biodiesel_percentage, 0) / data.length,
    avg_ethanol: data.reduce((sum, item) => sum + item.ethanol_percentage, 0) / data.length,
    avg_electricity: data.reduce((sum, item) => sum + (item.electricity_sin_factor || 0), 0) / data.length,
    latest_update: data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
  };

  return stats;
}