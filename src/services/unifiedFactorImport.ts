import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

export interface FactorImportResult {
  success: number;
  errors: number;
  warnings: number;
  details: string[];
}

export class UnifiedFactorImportService {
  
  /**
   * Import complete GHG Protocol Brasil 2025.0.1 factor database
   */
  static async importCompleteDatabase(): Promise<FactorImportResult> {
    logger.info('Iniciando importação completa da base GHG Protocol Brasil 2025.0.1', 'import');
    
    let totalSuccess = 0;
    let totalErrors = 0;
    const details: string[] = [];

    try {
      // 1. Stationary Combustion Factors
      const stationaryResult = await this.importStationaryCombustionFactors();
      totalSuccess += stationaryResult.success;
      totalErrors += stationaryResult.errors;
      details.push(`Combustão Estacionária: ${stationaryResult.success} fatores`);

      // 2. Mobile Combustion Factors
      const mobileResult = await this.importMobileCombustionFactors();
      totalSuccess += mobileResult.success;
      totalErrors += mobileResult.errors;
      details.push(`Combustão Móvel: ${mobileResult.success} fatores`);

      // 3. Electricity Factors
      const electricityResult = await this.importElectricityFactors();
      totalSuccess += electricityResult.success;
      totalErrors += electricityResult.errors;
      details.push(`Eletricidade: ${electricityResult.success} fatores`);

      // 4. Industrial Process Factors
      const industrialResult = await this.importIndustrialProcessFactors();
      totalSuccess += industrialResult.success;
      totalErrors += industrialResult.errors;
      details.push(`Processos Industriais: ${industrialResult.success} fatores`);

      // 5. Agriculture and AFOLU Factors
      const agricultureResult = await this.importAgricultureFactors();
      totalSuccess += agricultureResult.success;
      totalErrors += agricultureResult.errors;
      details.push(`Agricultura/AFOLU: ${agricultureResult.success} fatores`);

      // 6. Waste Factors
      const wasteResult = await this.importWasteFactors();
      totalSuccess += wasteResult.success;
      totalErrors += wasteResult.errors;
      details.push(`Resíduos: ${wasteResult.success} fatores`);

      return {
        success: totalSuccess,
        errors: totalErrors,
        warnings: 0,
        details
      };

    } catch (error) {
      logger.error('Erro na importação completa:', error, 'import');
      return {
        success: totalSuccess,
        errors: totalErrors + 1,
        warnings: 0,
        details: [...details, `Erro geral: ${error}`]
      };
    }
  }

  /**
   * Import stationary combustion factors
   */
  static async importStationaryCombustionFactors(): Promise<FactorImportResult> {
    const factors = [
      // Combustíveis Líquidos
      {
        name: 'Óleo Diesel (puro)',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 2.671,
        ch4_factor: 0.0001,
        n2o_factor: 0.000045,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 36.0,
        density: 0.84
      },
      {
        name: 'Óleo Combustível',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 3.124,
        ch4_factor: 0.0001,
        n2o_factor: 0.000045,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 40.4,
        density: 0.952
      },
      {
        name: 'Gasolina Automotiva (pura)',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 2.292,
        ch4_factor: 0.0002,
        n2o_factor: 0.000032,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 32.2,
        density: 0.742
      },
      {
        name: 'Querosene Iluminante',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 2.537,
        ch4_factor: 0.0001,
        n2o_factor: 0.000045,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 35.3,
        density: 0.775
      },
      {
        name: 'Querosene de Aviação',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 2.537,
        ch4_factor: 0.0001,
        n2o_factor: 0.000045,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 35.3,
        density: 0.775
      },
      {
        name: 'GLP - Gás Liquefeito de Petróleo',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 2.999,
        ch4_factor: 0.000062,
        n2o_factor: 0.0000062,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 47.3
      },
      
      // Combustíveis Gasosos
      {
        name: 'Gás Natural Seco',
        category: 'Combustão Estacionária',
        activity_unit: 'm³',
        co2_factor: 1.998,
        ch4_factor: 0.000037,
        n2o_factor: 0.0000037,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 38.3
      },
      {
        name: 'Gás Natural Úmido',
        category: 'Combustão Estacionária',
        activity_unit: 'm³',
        co2_factor: 2.232,
        ch4_factor: 0.000037,
        n2o_factor: 0.0000037,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 42.8
      },
      
      // Combustíveis Sólidos
      {
        name: 'Carvão Vapor 4200 kcal/kg',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 1.685,
        ch4_factor: 0.00003,
        n2o_factor: 0.0000015,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 17.6
      },
      {
        name: 'Carvão Vapor 5900 kcal/kg',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 2.366,
        ch4_factor: 0.00003,
        n2o_factor: 0.0000015,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 24.7
      },
      {
        name: 'Carvão Vegetal',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0003,
        n2o_factor: 0.000004,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 29.5,
        biogenic_fraction: 1.0
      },
      {
        name: 'Lenha Comercial',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0003,
        n2o_factor: 0.000004,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 14.2,
        biogenic_fraction: 1.0
      },
      
      // Biocombustíveis
      {
        name: 'Etanol Anidro',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0002,
        n2o_factor: 0.000032,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 21.1,
        density: 0.791,
        biogenic_fraction: 1.0
      },
      {
        name: 'Etanol Hidratado',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0002,
        n2o_factor: 0.000032,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 20.1,
        density: 0.809,
        biogenic_fraction: 1.0
      },
      {
        name: 'Biodiesel (B100)',
        category: 'Combustão Estacionária',
        activity_unit: 'Litro',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0001,
        n2o_factor: 0.000045,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 33.8,
        density: 0.88,
        biogenic_fraction: 1.0
      },
      {
        name: 'Bagaço de Cana',
        category: 'Combustão Estacionária',
        activity_unit: 'kg',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.0003,
        n2o_factor: 0.000004,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        calorific_value: 7.8,
        biogenic_fraction: 1.0
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Import mobile combustion factors
   */
  static async importMobileCombustionFactors(): Promise<FactorImportResult> {
    const factors = [
      {
        name: 'Gasolina - Combustão Móvel',
        category: 'Combustão Móvel',
        activity_unit: 'Litro',
        co2_factor: 2.292,
        ch4_factor: 0.000025,
        n2o_factor: 0.000044,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Diesel - Combustão Móvel',
        category: 'Combustão Móvel',
        activity_unit: 'Litro',
        co2_factor: 2.671,
        ch4_factor: 0.0000038,
        n2o_factor: 0.000044,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Etanol - Combustão Móvel',
        category: 'Combustão Móvel',
        activity_unit: 'Litro',
        co2_factor: 0.0, // Biogênico
        ch4_factor: 0.000025,
        n2o_factor: 0.000044,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025,
        biogenic_fraction: 1.0
      },
      {
        name: 'GNV - Gás Natural Veicular',
        category: 'Combustão Móvel',
        activity_unit: 'm³',
        co2_factor: 1.998,
        ch4_factor: 0.000092,
        n2o_factor: 0.0000032,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Import electricity factors
   */
  static async importElectricityFactors(): Promise<FactorImportResult> {
    const factors = [
      {
        name: 'Eletricidade - SIN (Sistema Interligado Nacional)',
        category: 'Eletricidade Adquirida',
        activity_unit: 'MWh',
        co2_factor: 0.0829, // tCO2/MWh (valor médio 2024)
        ch4_factor: 0.0000012,
        n2o_factor: 0.0000004,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Eletricidade - Média Brasil',
        category: 'Eletricidade Adquirida',
        activity_unit: 'MWh',
        co2_factor: 0.0967, // Incluindo distribuição
        ch4_factor: 0.0000014,
        n2o_factor: 0.0000005,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Import industrial process factors  
   */
  static async importIndustrialProcessFactors(): Promise<FactorImportResult> {
    const factors = [
      {
        name: 'Produção de Cimento - Calcário',
        category: 'Processos Industriais',
        activity_unit: 'kg de clinquer',
        co2_factor: 0.525,
        ch4_factor: 0.0,
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Produção de Cal',
        category: 'Processos Industriais',
        activity_unit: 'kg de cal',
        co2_factor: 0.785,
        ch4_factor: 0.0,
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Produção de Aço - Alto Forno',
        category: 'Processos Industriais',
        activity_unit: 'kg de aço bruto',
        co2_factor: 2.1,
        ch4_factor: 0.0,
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Import agriculture factors
   */
  static async importAgricultureFactors(): Promise<FactorImportResult> {
    const factors = [
      {
        name: 'Fermentação Entérica - Bovinos Leiteiros',
        category: 'Agricultura - Pecuária',
        activity_unit: 'cabeça/ano',
        co2_factor: 0.0,
        ch4_factor: 0.057, // kg CH4/cabeça/ano
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Fermentação Entérica - Bovinos de Corte',
        category: 'Agricultura - Pecuária',
        activity_unit: 'cabeça/ano',
        co2_factor: 0.0,
        ch4_factor: 0.056, // kg CH4/cabeça/ano
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Manejo de Dejetos - Bovinos',
        category: 'Agricultura - Pecuária',
        activity_unit: 'cabeça/ano',
        co2_factor: 0.0,
        ch4_factor: 0.001, // kg CH4/cabeça/ano
        n2o_factor: 0.00017, // kg N2O/cabeça/ano
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Aplicação de Fertilizantes Nitrogenados',
        category: 'Agricultura - Solos',
        activity_unit: 'kg N aplicado',
        co2_factor: 0.0,
        ch4_factor: 0.0,
        n2o_factor: 0.01, // 1% do N aplicado
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Import waste factors
   */
  static async importWasteFactors(): Promise<FactorImportResult> {
    const factors = [
      {
        name: 'Aterro Sanitário - Resíduos Orgânicos',
        category: 'Resíduos',
        activity_unit: 'kg de resíduo',
        co2_factor: 0.0,
        ch4_factor: 0.1, // kg CH4/kg resíduo orgânico
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Tratamento de Efluentes - DQO',
        category: 'Resíduos',
        activity_unit: 'kg DQO',
        co2_factor: 0.0,
        ch4_factor: 0.25, // kg CH4/kg DQO removida
        n2o_factor: 0.0,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      },
      {
        name: 'Incineração de Resíduos',
        category: 'Resíduos',
        activity_unit: 'kg de resíduo',
        co2_factor: 1.1, // Média para resíduos mistos
        ch4_factor: 0.00006,
        n2o_factor: 0.00015,
        source: 'GHG Protocol Brasil 2025.0.1',
        year_of_validity: 2025
      }
    ];

    return await this.insertFactors(factors);
  }

  /**
   * Insert factors into database using system privileges
   */
  private static async insertFactors(factors: any[]): Promise<FactorImportResult> {
    let success = 0;
    let errors = 0;

    for (const factor of factors) {
      try {
        const { error } = await supabase
          .from('emission_factors')
          .upsert({
            ...factor,
            type: 'system',
            company_id: null,
            validation_status: 'validated'
          }, {
            onConflict: 'name,category,activity_unit',
            ignoreDuplicates: false
          });

        if (error) {
          logger.error(`Erro ao inserir fator ${factor.name}:`, error, 'import');
          errors++;
        } else {
          success++;
        }
      } catch (error) {
        logger.error(`Erro ao processar fator ${factor.name}:`, error, 'import');
        errors++;
      }
    }

    return { success, errors, warnings: 0, details: [] };
  }
}