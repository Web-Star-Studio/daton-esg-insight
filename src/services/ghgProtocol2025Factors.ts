import { supabase } from "@/integrations/supabase/client";
import { CreateEmissionFactorData } from "./emissionFactors";

// Fatores de emissão atualizados do GHG Protocol Brasil 2025 baseados no PDF
export interface GHG2025EmissionFactor extends CreateEmissionFactorData {
  fuel_type?: string;
  density?: number;
  calorific_value?: number;
  biogenic_fraction?: number;
}

// Seção 2 - Fatores de emissão para combustão estacionária (unidades convertidas)
const STATIONARY_COMBUSTION_FACTORS_2025: GHG2025EmissionFactor[] = [
  // Combustíveis Líquidos
  {
    name: "Óleo Combustível",
    category: "Combustão Estacionária",
    activity_unit: "litros",
    co2_factor: 2.7109,
    ch4_factor: 0.0000, 
    n2o_factor: 0.0000,
    fuel_type: "Líquido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.96,
    calorific_value: 40.4,
    biogenic_fraction: 0
  },
  {
    name: "Óleo Diesel",
    category: "Combustão Estacionária", 
    activity_unit: "litros",
    co2_factor: 2.6770,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Líquido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.84,
    calorific_value: 43.0,
    biogenic_fraction: 0
  },
  {
    name: "Gasolina Comum",
    category: "Combustão Estacionária",
    activity_unit: "litros", 
    co2_factor: 2.2681,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Líquido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.74,
    calorific_value: 44.3,
    biogenic_fraction: 0
  },
  {
    name: "Etanol Hidratado",
    category: "Combustão Estacionária",
    activity_unit: "litros",
    co2_factor: 1.2283,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Líquido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.81,
    calorific_value: 21.2,
    biogenic_fraction: 1.0
  },
  {
    name: "Querosene",
    category: "Combustão Estacionária",
    activity_unit: "litros",
    co2_factor: 2.5206,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Líquido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.80,
    calorific_value: 43.8,
    biogenic_fraction: 0
  },

  // Combustíveis Gasosos
  {
    name: "Gás Natural",
    category: "Combustão Estacionária",
    activity_unit: "m³",
    co2_factor: 1.9990,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasoso",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.7,
    calorific_value: 38.7,
    biogenic_fraction: 0
  },
  {
    name: "GLP - Gás Liquefeito de Petróleo",
    category: "Combustão Estacionária",
    activity_unit: "kg",
    co2_factor: 2.9389,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasoso",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    density: 0.54,
    calorific_value: 47.3,
    biogenic_fraction: 0
  },

  // Combustíveis Sólidos
  {
    name: "Carvão Mineral",
    category: "Combustão Estacionária",
    activity_unit: "kg",
    co2_factor: 2.2645,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Sólido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    calorific_value: 25.8,
    biogenic_fraction: 0
  },
  {
    name: "Lenha",
    category: "Combustão Estacionária",
    activity_unit: "kg",
    co2_factor: 1.8336,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Sólido",
    source: "GHG Protocol Brasil 2025.0.1", 
    year_of_validity: 2025,
    calorific_value: 15.6,
    biogenic_fraction: 1.0
  },
  {
    name: "Carvão Vegetal",
    category: "Combustão Estacionária",
    activity_unit: "kg", 
    co2_factor: 3.2022,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Sólido",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    calorific_value: 29.7,
    biogenic_fraction: 1.0
  }
];

// Fatores de emissão por frota e tipo de combustível (por ano do modelo)
const MOBILE_COMBUSTION_FACTORS_2025: GHG2025EmissionFactor[] = [
  // Automóveis - Gasolina C (2024)
  {
    name: "Automóvel - Gasolina C (2024)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 0.1524,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasolina C",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2024,
    details_json: {
      vehicle_category: "Automóvel",
      model_year: 2024,
      fuel_mix: "Gasolina C (25% etanol)"
    }
  },
  {
    name: "Automóvel - Gasolina C (2023)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 0.1587,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasolina C",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2023,
    details_json: {
      vehicle_category: "Automóvel",
      model_year: 2023,
      fuel_mix: "Gasolina C (25% etanol)"
    }
  },
  {
    name: "Automóvel - Gasolina C (2022)",
    category: "Combustão Móvel", 
    activity_unit: "km",
    co2_factor: 0.1651,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasolina C",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2022,
    details_json: {
      vehicle_category: "Automóvel",
      model_year: 2022,
      fuel_mix: "Gasolina C (25% etanol)"
    }
  },

  // Automóveis - Etanol (2024)
  {
    name: "Automóvel - Etanol (2024)",
    category: "Combustão Móvel",
    activity_unit: "km", 
    co2_factor: 0.0765,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Etanol",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2024,
    biogenic_fraction: 1.0,
    details_json: {
      vehicle_category: "Automóvel",
      model_year: 2024,
      fuel_mix: "Etanol hidratado"
    }
  },

  // Comercial Leve - Diesel (2024)
  {
    name: "Comercial Leve - Diesel (2024)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 0.1897,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Diesel",
    source: "GHG Protocol Brasil 2025.0.1", 
    year_of_validity: 2024,
    details_json: {
      vehicle_category: "Comercial Leve",
      model_year: 2024,
      fuel_mix: "Diesel S-10"
    }
  },

  // Ônibus Urbano - Diesel (2024)
  {
    name: "Ônibus Urbano - Diesel (2024)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 1.2376,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Diesel",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2024,
    details_json: {
      vehicle_category: "Ônibus Urbano", 
      model_year: 2024,
      fuel_mix: "Diesel S-10"
    }
  },

  // Caminhão - Diesel (2024)
  {
    name: "Caminhão - Diesel (2024)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 0.7832,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Diesel",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2024,
    details_json: {
      vehicle_category: "Caminhão",
      model_year: 2024,
      fuel_mix: "Diesel S-10"
    }
  },

  // Motocicleta - Gasolina C (2024)
  {
    name: "Motocicleta - Gasolina C (2024)",
    category: "Combustão Móvel",
    activity_unit: "km",
    co2_factor: 0.0634,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    fuel_type: "Gasolina C",
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2024,
    details_json: {
      vehicle_category: "Motocicleta",
      model_year: 2024,
      fuel_mix: "Gasolina C (25% etanol)"
    }
  }
];

// Fatores de eletricidade atualizados 2025
const ELECTRICITY_FACTORS_2025: GHG2025EmissionFactor[] = [
  {
    name: "Eletricidade - SIN (Sistema Interligado Nacional)",
    category: "Energia Adquirida",
    activity_unit: "kWh", 
    co2_factor: 0.0730,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    details_json: {
      grid_type: "SIN",
      emission_scope: "Scope 2",
      methodology: "Location-based"
    }
  },
  {
    name: "Eletricidade - Sistemas Isolados",
    category: "Energia Adquirida",
    activity_unit: "kWh",
    co2_factor: 0.2456,
    ch4_factor: 0.0000,
    n2o_factor: 0.0000,
    source: "GHG Protocol Brasil 2025.0.1",
    year_of_validity: 2025,
    details_json: {
      grid_type: "Sistemas Isolados",
      emission_scope: "Scope 2",
      methodology: "Location-based"
    }
  }
];

// Combinar todos os fatores
const ALL_GHG_2025_FACTORS: GHG2025EmissionFactor[] = [
  ...STATIONARY_COMBUSTION_FACTORS_2025,
  ...MOBILE_COMBUSTION_FACTORS_2025,
  ...ELECTRICITY_FACTORS_2025
];

export class GHG2025FactorsService {
  
  async importAllFactors(): Promise<{ success: number; errors: number; message: string }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log(`Iniciando importação de ${ALL_GHG_2025_FACTORS.length} fatores GHG Protocol Brasil 2025...`);

    for (const factor of ALL_GHG_2025_FACTORS) {
      try {
        // Verificar se o fator já existe
        const { data: existingFactor } = await supabase
          .from('emission_factors')
          .select('id')
          .eq('name', factor.name)
          .eq('category', factor.category)
          .eq('year_of_validity', factor.year_of_validity)
          .eq('type', 'system')
          .single();

        if (existingFactor) {
          // Atualizar fator existente
          const { error: updateError } = await supabase
            .from('emission_factors')
            .update({
              activity_unit: factor.activity_unit,
              co2_factor: factor.co2_factor,
              ch4_factor: factor.ch4_factor,
              n2o_factor: factor.n2o_factor,
              source: factor.source,
              fuel_type: factor.fuel_type,
              density: factor.density,
              calorific_value: factor.calorific_value,
              biogenic_fraction: factor.biogenic_fraction,
              details_json: factor.details_json
            })
            .eq('id', existingFactor.id);

          if (updateError) throw updateError;
          console.log(`✓ Atualizado: ${factor.name}`);
        } else {
          // Inserir novo fator
          const { error: insertError } = await supabase
            .from('emission_factors')
            .insert({
              name: factor.name,
              category: factor.category,
              activity_unit: factor.activity_unit,
              co2_factor: factor.co2_factor,
              ch4_factor: factor.ch4_factor,
              n2o_factor: factor.n2o_factor,
              source: factor.source,
              year_of_validity: factor.year_of_validity,
              type: 'system',
              fuel_type: factor.fuel_type,
              density: factor.density,
              calorific_value: factor.calorific_value,
              biogenic_fraction: factor.biogenic_fraction,
              details_json: factor.details_json
            });

          if (insertError) throw insertError;
          console.log(`✓ Criado: ${factor.name}`);
        }

        successCount++;

      } catch (error) {
        console.error(`Erro ao processar fator ${factor.name}:`, error);
        errors.push(`${factor.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        errorCount++;
      }
    }

    const message = `Importação concluída: ${successCount} fatores processados com sucesso, ${errorCount} erros.`;
    console.log(message);

    if (errors.length > 0) {
      console.error('Erros encontrados:', errors);
    }

    return {
      success: successCount,
      errors: errorCount,
      message
    };
  }

  async getFactorsByYear(year: number): Promise<GHG2025EmissionFactor[]> {
    const { data, error } = await supabase
      .from('emission_factors')
      .select('*')
      .eq('year_of_validity', year)
      .order('category')
      .order('name');

    if (error) {
      console.error('Erro ao buscar fatores por ano:', error);
      throw error;
    }

    return data || [];
  }

  async getAvailableYears(): Promise<number[]> {
    const { data, error } = await supabase
      .from('emission_factors')
      .select('year_of_validity')
      .not('year_of_validity', 'is', null)
      .order('year_of_validity', { ascending: false });

    if (error) {
      console.error('Erro ao buscar anos disponíveis:', error);
      throw error;
    }

    const years = [...new Set(data?.map(item => item.year_of_validity).filter(Boolean))] as number[];
    return years;
  }

  async getFactorsByCategory(category: string, year?: number): Promise<GHG2025EmissionFactor[]> {
    let query = supabase
      .from('emission_factors')
      .select('*')
      .eq('category', category);

    if (year) {
      query = query.eq('year_of_validity', year);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Erro ao buscar fatores por categoria:', error);
      throw error;
    }

    return data || [];
  }
}

// Instância do serviço
export const ghg2025FactorsService = new GHG2025FactorsService();