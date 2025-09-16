import { supabase } from "@/integrations/supabase/client";

interface EmissionFactorUpdate {
  name: string;
  category: string;
  activity_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  source: string;
  year_of_validity?: number;
  biogenic_fraction?: number;
  calorific_value?: number;
  calorific_value_unit?: string;
  density?: number;
  density_unit?: string;
  fuel_type?: string;
  is_biofuel?: boolean;
}

export class EmissionFactorsUpdateService {
  
  /**
   * Atualiza fatores de emissão existentes ou cria novos
   * Implementa lógica anti-duplicação inteligente
   */
  async updateEmissionFactors(factors: EmissionFactorUpdate[]): Promise<{
    updated: number;
    created: number;
    errors: string[];
  }> {
    const result = {
      updated: 0,
      created: 0,
      errors: [] as string[]
    };

    for (const factor of factors) {
      try {
        // Buscar fator existente
        const { data: existingFactors, error: searchError } = await supabase
          .from('emission_factors')
          .select('*')
          .eq('name', factor.name)
          .eq('category', factor.category)
          .eq('activity_unit', factor.activity_unit)
          .eq('type', 'system');

        if (searchError) {
          result.errors.push(`Erro ao buscar fator ${factor.name}: ${searchError.message}`);
          continue;
        }

        if (existingFactors && existingFactors.length > 0) {
          // Atualizar fator existente
          const existingFactor = existingFactors[0];
          
          const { error: updateError } = await supabase
            .from('emission_factors')
            .update({
              co2_factor: factor.co2_factor ?? existingFactor.co2_factor,
              ch4_factor: factor.ch4_factor ?? existingFactor.ch4_factor,
              n2o_factor: factor.n2o_factor ?? existingFactor.n2o_factor,
              source: factor.source,
              year_of_validity: factor.year_of_validity ?? new Date().getFullYear(),
              biogenic_fraction: factor.biogenic_fraction ?? existingFactor.biogenic_fraction,
              calorific_value: factor.calorific_value ?? existingFactor.calorific_value,
              calorific_value_unit: factor.calorific_value_unit ?? existingFactor.calorific_value_unit,
              density: factor.density ?? existingFactor.density,
              density_unit: factor.density_unit ?? existingFactor.density_unit,
              fuel_type: factor.fuel_type ?? existingFactor.fuel_type,
              is_biofuel: factor.is_biofuel ?? existingFactor.is_biofuel,
              validation_status: 'validated'
            })
            .eq('id', existingFactor.id);

          if (updateError) {
            result.errors.push(`Erro ao atualizar ${factor.name}: ${updateError.message}`);
          } else {
            result.updated++;
          }
        } else {
          // Criar novo fator
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
              year_of_validity: factor.year_of_validity ?? new Date().getFullYear(),
              biogenic_fraction: factor.biogenic_fraction ?? 0,
              calorific_value: factor.calorific_value,
              calorific_value_unit: factor.calorific_value_unit,
              density: factor.density,
              density_unit: factor.density_unit,
              fuel_type: factor.fuel_type,
              is_biofuel: factor.is_biofuel ?? false,
              type: 'system',
              validation_status: 'validated'
            });

          if (insertError) {
            result.errors.push(`Erro ao criar ${factor.name}: ${insertError.message}`);
          } else {
            result.created++;
          }
        }
      } catch (error) {
        result.errors.push(`Erro inesperado com ${factor.name}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Obtém fatores de emissão corretos do GHG Protocol Brasil 2025.0.1
   * com unidades convertidas para facilitar cálculos
   */
  getUpdatedEmissionFactors(): EmissionFactorUpdate[] {
    return [
      // Combustão Estacionária - Combustíveis Líquidos
      {
        name: "Óleo Diesel",
        category: "Combustão Estacionária",
        activity_unit: "L",
        co2_factor: 2.671, // kg CO2/L (convertido)
        ch4_factor: 0.0003, // kg CH4/L
        n2o_factor: 0.0013, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0,
        density: 0.84, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: false
      },
      {
        name: "Gasolina Comum",
        category: "Combustão Estacionária",
        activity_unit: "L",
        co2_factor: 2.302, // kg CO2/L (convertido)
        ch4_factor: 0.0004, // kg CH4/L
        n2o_factor: 0.0008, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0,
        density: 0.74, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: false
      },
      {
        name: "Óleo Combustível",
        category: "Combustão Estacionária",
        activity_unit: "L",
        co2_factor: 3.124, // kg CO2/L (convertido)
        ch4_factor: 0.0003, // kg CH4/L
        n2o_factor: 0.0006, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0,
        density: 0.98, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: false
      },
      
      // Combustão Estacionária - Combustíveis Gasosos
      {
        name: "Gás Natural",
        category: "Combustão Estacionária",
        activity_unit: "m³",
        co2_factor: 1.960, // kg CO2/m³ (convertido)
        ch4_factor: 0.0037, // kg CH4/m³
        n2o_factor: 0.0037, // kg N2O/m³
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0,
        fuel_type: "Gasoso",
        is_biofuel: false
      },
      {
        name: "GLP",
        category: "Combustão Estacionária",
        activity_unit: "kg",
        co2_factor: 2.929, // kg CO2/kg
        ch4_factor: 0.001, // kg CH4/kg
        n2o_factor: 0.0001, // kg N2O/kg
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0,
        fuel_type: "Gasoso",
        is_biofuel: false
      },
      
      // Combustão Móvel - Rodoviário
      {
        name: "Gasolina C (Veículos Leves)",
        category: "Combustão Móvel",
        activity_unit: "L",
        co2_factor: 2.272, // kg CO2/L (considerando 27% etanol)
        ch4_factor: 0.0004, // kg CH4/L
        n2o_factor: 0.0008, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0.27, // 27% etanol
        density: 0.74, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: false
      },
      {
        name: "Etanol Hidratado",
        category: "Combustão Móvel",
        activity_unit: "L",
        co2_factor: 1.508, // kg CO2/L
        ch4_factor: 0.0003, // kg CH4/L
        n2o_factor: 0.0008, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 1.0, // 100% biocombustível
        density: 0.81, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: true
      },
      {
        name: "Diesel S-10 (Veículos Pesados)",
        category: "Combustão Móvel",
        activity_unit: "L",
        co2_factor: 2.403, // kg CO2/L (com biodiesel)
        ch4_factor: 0.0003, // kg CH4/L
        n2o_factor: 0.0013, // kg N2O/L
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0.10, // 10% biodiesel
        density: 0.84, // kg/L
        density_unit: "kg/L",
        fuel_type: "Líquido",
        is_biofuel: false
      },
      
      // Eletricidade - Grid Brasileiro
      {
        name: "Eletricidade - SIN",
        category: "Eletricidade Adquirida",
        activity_unit: "MWh",
        co2_factor: 76.4, // kg CO2/MWh (fator médio SIN 2024)
        source: "GHG Protocol Brasil 2025.0.1 / ONS",
        year_of_validity: 2024,
        biogenic_fraction: 0
      },
      
      // Processos Industriais
      {
        name: "Produção de Cimento",
        category: "Processos Industriais",
        activity_unit: "t",
        co2_factor: 510.0, // kg CO2/t cimento
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0
      },
      {
        name: "Produção de Aço",
        category: "Processos Industriais", 
        activity_unit: "t",
        co2_factor: 2100.0, // kg CO2/t aço
        source: "GHG Protocol Brasil 2025.0.1",
        year_of_validity: 2025,
        biogenic_fraction: 0
      }
    ];
  }

  /**
   * Executa atualização completa dos fatores de emissão
   */
  async executeCompleteUpdate(): Promise<{
    updated: number;
    created: number;
    errors: string[];
  }> {
    const updatedFactors = this.getUpdatedEmissionFactors();
    return await this.updateEmissionFactors(updatedFactors);
  }
}

export const emissionFactorsUpdateService = new EmissionFactorsUpdateService();