import { supabase } from '@/integrations/supabase/client';

// GHG Protocol Brasil 2025.0.1 - Industrial Processes
export interface IndustrialEmissionFactor {
  id?: string;
  name: string;
  industry_sector: string;
  process_type: string;
  emission_factor: number;
  emission_factor_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  other_gases?: Record<string, number>;
  activity_unit: string;
  source: string;
  category: string;
  methodology: string;
  applicable_products?: string[];
  reference_conditions?: string;
  uncertainty_range?: string;
}

// Industrial Process Emission Factors from GHG Protocol Brasil 2025.0.1
export const INDUSTRIAL_EMISSION_FACTORS: Omit<IndustrialEmissionFactor, 'id'>[] = [
  // STEEL INDUSTRY (Siderurgia)
  {
    name: 'Produção de Ferro Gusa - Alto-forno',
    industry_sector: 'Siderurgia',
    process_type: 'Redução de Minério',
    emission_factor: 2.3,
    emission_factor_unit: 'tCO2/t ferro gusa',
    co2_factor: 2300,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Ferro Gusa'],
    reference_conditions: 'Condições padrão de operação',
    uncertainty_range: '±15%'
  },
  {
    name: 'Produção de Aço - Conversor LD',
    industry_sector: 'Siderurgia',
    process_type: 'Refino de Aço',
    emission_factor: 0.07,
    emission_factor_unit: 'tCO2/t aço',
    co2_factor: 70,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Aço Líquido'],
    reference_conditions: 'Conversor a oxigênio',
    uncertainty_range: '±10%'
  },
  {
    name: 'Produção de Aço - Forno Elétrico a Arco',
    industry_sector: 'Siderurgia',
    process_type: 'Fusão Elétrica',
    emission_factor: 0.08,
    emission_factor_unit: 'tCO2/t aço',
    co2_factor: 80,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Aço Líquido'],
    reference_conditions: 'Forno elétrico a arco',
    uncertainty_range: '±12%'
  },

  // CEMENT INDUSTRY (Cimento)
  {
    name: 'Calcinação de Calcário - Produção de Clínquer',
    industry_sector: 'Cimento',
    process_type: 'Calcinação',
    emission_factor: 0.525,
    emission_factor_unit: 'tCO2/t clínquer',
    co2_factor: 525,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão Padrão',
    applicable_products: ['Clínquer'],
    reference_conditions: 'CaCO3 = 100%',
    uncertainty_range: '±5%'
  },
  {
    name: 'Outras Matérias-primas Carbonáticas - Cimento',
    industry_sector: 'Cimento',
    process_type: 'Calcinação',
    emission_factor: 0.44,
    emission_factor_unit: 'tCO2/t material',
    co2_factor: 440,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Dolomita', 'Magnesita'],
    reference_conditions: 'Material carbonático',
    uncertainty_range: '±8%'
  },

  // ALUMINUM INDUSTRY (Alumínio)
  {
    name: 'Produção de Alumínio Primário - Eletrólise',
    industry_sector: 'Alumínio',
    process_type: 'Eletrólise',
    emission_factor: 1.5,
    emission_factor_unit: 'tCO2/t alumínio',
    co2_factor: 1500,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão Tecnológico',
    applicable_products: ['Alumínio Primário'],
    reference_conditions: 'Processo Hall-Héroult',
    uncertainty_range: '±20%'
  },

  // CHEMICAL INDUSTRY (Químicos)
  {
    name: 'Produção de Amônia',
    industry_sector: 'Químicos',
    process_type: 'Síntese Química',
    emission_factor: 1.5,
    emission_factor_unit: 'tCO2/t amônia',
    co2_factor: 1500,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Amônia'],
    reference_conditions: 'Processo Haber-Bosch',
    uncertainty_range: '±10%'
  },
  {
    name: 'Produção de Ácido Nítrico',
    industry_sector: 'Químicos',
    process_type: 'Oxidação Catalítica',
    emission_factor: 0.3,
    emission_factor_unit: 'tCO2e/t ácido nítrico',
    co2_factor: 0,
    n2o_factor: 1000, // N2O emissions (more significant than CO2)
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão N2O',
    applicable_products: ['Ácido Nítrico'],
    reference_conditions: '100% HNO3',
    uncertainty_range: '±25%'
  },

  // GLASS INDUSTRY (Vidro)
  {
    name: 'Produção de Vidro - Fusão',
    industry_sector: 'Vidro',
    process_type: 'Fusão de Matérias-primas',
    emission_factor: 0.2,
    emission_factor_unit: 'tCO2/t vidro',
    co2_factor: 200,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Vidro Float', 'Vidro Comum'],
    reference_conditions: 'Matérias-primas carbonáticas',
    uncertainty_range: '±15%'
  },

  // LIME INDUSTRY (Cal)
  {
    name: 'Produção de Cal - Calcinação',
    industry_sector: 'Cal',
    process_type: 'Calcinação',
    emission_factor: 0.785,
    emission_factor_unit: 'tCO2/t cal',
    co2_factor: 785,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',  
    methodology: 'Fator de Emissão Estequiométrico',
    applicable_products: ['Cal Viva', 'Cal Hidratada'],
    reference_conditions: 'CaCO3 → CaO + CO2',
    uncertainty_range: '±5%'
  },

  // CERAMICS INDUSTRY (Cerâmica)
  {
    name: 'Produção de Cerâmica - Calcinação',
    industry_sector: 'Cerâmica',
    process_type: 'Queima de Materiais',
    emission_factor: 0.15,
    emission_factor_unit: 'tCO2/t produto',
    co2_factor: 150,
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    category: 'Processos Industriais',
    methodology: 'Fator de Emissão',
    applicable_products: ['Telhas', 'Tijolos', 'Revestimentos'],
    reference_conditions: 'Materiais argilosos',
    uncertainty_range: '±20%'
  }
];

// Get emission factor by industry and process
export function getEmissionFactorByProcess(
  industrySector: string, 
  processType: string
): Omit<IndustrialEmissionFactor, 'id'> | undefined {
  return INDUSTRIAL_EMISSION_FACTORS.find(factor => 
    factor.industry_sector.toLowerCase() === industrySector.toLowerCase() &&
    factor.process_type.toLowerCase().includes(processType.toLowerCase())
  );
}

// Get all emission factors for an industry
export function getEmissionFactorsByIndustry(
  industrySector: string
): Omit<IndustrialEmissionFactor, 'id'>[] {
  return INDUSTRIAL_EMISSION_FACTORS.filter(factor => 
    factor.industry_sector.toLowerCase() === industrySector.toLowerCase()
  );
}

// Calculate industrial process emissions according to GHG Protocol Brasil
export function calculateIndustrialProcessEmissions(
  processName: string,
  calculationMethod: 'emission_factor' | 'mass_balance' | 'consumption_input',
  data: {
    productionQuantity?: number;
    productionUnit?: string;
    emissionFactor?: number;
    emissionFactorUnit?: string;
    inputQuantity?: number;
    outputQuantity?: number;
    rawMaterialQuantity?: number;
    conversionFactor?: number;
    customEmissionFactor?: number;
  }
): {
  total_co2e: number;
  raw_co2: number;
  raw_ch4: number;
  raw_n2o: number;
  calculation_details: any;
} {
  let calculation_details: any = {
    process_name: processName,
    calculation_method: calculationMethod,
    methodology: 'GHG Protocol Brasil 2025.0.1',
  };

  let totalCO2e = 0;
  let rawCO2 = 0;
  let rawCH4 = 0;
  let rawN2O = 0;

  // GWP values from AR4 (GHG Protocol Brasil standard)
  const GWP_CH4 = 25;
  const GWP_N2O = 298;

  try {
    switch (calculationMethod) {
      case 'emission_factor':
        if (!data.productionQuantity || !data.emissionFactor) {
          throw new Error('Dados de produção e fator de emissão são obrigatórios');
        }

        // Convert production to tonnes if needed
        let productionInTonnes = data.productionQuantity;
        if (data.productionUnit === 'kg') {
          productionInTonnes = data.productionQuantity / 1000;
        }

        // Convert emission factor to tCO2/t if needed
        let factorInTonnes = data.emissionFactor;
        if (data.emissionFactorUnit?.includes('kg')) {
          factorInTonnes = data.emissionFactor / 1000;
        }

        totalCO2e = productionInTonnes * factorInTonnes;
        rawCO2 = totalCO2e; // Assume all CO2 for simplicity

        calculation_details = {
          ...calculation_details,
          production_quantity: productionInTonnes,
          production_unit: 'tonnes',
          emission_factor: factorInTonnes,
          emission_factor_unit: 'tCO2/t',
          formula: 'Produção × Fator de Emissão'
        };
        break;

      case 'mass_balance':
        if (!data.inputQuantity || !data.outputQuantity) {
          throw new Error('Dados de entrada e saída são obrigatórios para balanço de massa');
        }

        // Simplified mass balance calculation
        // For carbonates: CaCO3 → CaO + CO2
        // Stoichiometric factor for calcite: 0.44 tCO2/t CaCO3
        const massLoss = data.inputQuantity - data.outputQuantity;
        const carbonContent = 0.44; // Default carbon content factor
        totalCO2e = massLoss * carbonContent;
        rawCO2 = totalCO2e;

        calculation_details = {
          ...calculation_details,
          input_quantity: data.inputQuantity,
          output_quantity: data.outputQuantity,
          mass_loss: massLoss,
          carbon_content_factor: carbonContent,
          formula: '(Entrada - Saída) × Fator de Carbono'
        };
        break;

      case 'consumption_input':
        if (!data.rawMaterialQuantity || !data.conversionFactor) {
          throw new Error('Dados de consumo de matéria-prima e fator de conversão são obrigatórios');
        }

        totalCO2e = data.rawMaterialQuantity * data.conversionFactor;
        rawCO2 = totalCO2e;

        calculation_details = {
          ...calculation_details,
          raw_material_quantity: data.rawMaterialQuantity,
          conversion_factor: data.conversionFactor,
          formula: 'Insumo Consumido × Fator de Conversão'
        };
        break;

      default:
        throw new Error(`Método de cálculo "${calculationMethod}" não suportado`);
    }

    calculation_details.total_co2e = totalCO2e;
    calculation_details.raw_emissions = {
      co2: rawCO2,
      ch4: rawCH4,
      n2o: rawN2O
    };

  } catch (error: any) {
    throw new Error(`Erro no cálculo de processos industriais: ${error.message}`);
  }

  return {
    total_co2e: Math.round(totalCO2e * 1000) / 1000, // Round to 3 decimal places
    raw_co2: Math.round(rawCO2 * 1000) / 1000,
    raw_ch4: Math.round(rawCH4 * 1000) / 1000,
    raw_n2o: Math.round(rawN2O * 1000) / 1000,
    calculation_details
  };
}

// Import industrial emission factors into database
export async function importIndustrialEmissionFactors(): Promise<{success: number; errors: string[]}> {
  const errors: string[] = [];
  let success = 0;

  try {
    for (const factor of INDUSTRIAL_EMISSION_FACTORS) {
      const { error } = await supabase
        .from('emission_factors')
        .upsert({
          name: factor.name,
          category: factor.category,
          source: factor.source,
          activity_unit: factor.activity_unit,
          co2_factor: factor.co2_factor,
          ch4_factor: factor.ch4_factor,
          n2o_factor: factor.n2o_factor,
          details_json: {
            industry_sector: factor.industry_sector,
            process_type: factor.process_type,
            emission_factor: factor.emission_factor,
            emission_factor_unit: factor.emission_factor_unit,
            methodology: factor.methodology,
            applicable_products: factor.applicable_products,
            reference_conditions: factor.reference_conditions,
            uncertainty_range: factor.uncertainty_range,
            other_gases: factor.other_gases
          },
          type: 'system',
          validation_status: 'validated'
        }, {
          onConflict: 'name,category,source'
        });

      if (error) {
        errors.push(`Erro ao importar ${factor.name}: ${error.message}`);
      } else {
        success++;
      }
    }
  } catch (error: any) {
    errors.push(`Erro geral na importação: ${error.message}`);
  }

  return { success, errors };
}

// Get recommended emission factor for a specific industrial process
export function getRecommendedEmissionFactor(
  industrySector: string, 
  specificProcess?: string
): Omit<IndustrialEmissionFactor, 'id'> | undefined {
  const factors = getEmissionFactorsByIndustry(industrySector);
  
  if (specificProcess) {
    return factors.find(f => 
      f.name.toLowerCase().includes(specificProcess.toLowerCase()) ||
      f.process_type.toLowerCase().includes(specificProcess.toLowerCase())
    );
  }
  
  return factors[0]; // Return first available factor for the industry
}

// Validate if emission factor is appropriate for the process
export function validateEmissionFactorForProcess(
  factorName: string, 
  industrySector: string, 
  processType: string
): boolean {
  const factor = INDUSTRIAL_EMISSION_FACTORS.find(f => f.name === factorName);
  
  if (!factor) return false;
  
  return factor.industry_sector.toLowerCase() === industrySector.toLowerCase() &&
         factor.process_type.toLowerCase().includes(processType.toLowerCase());
}

// Get uncertainty range for a process
export function getProcessUncertainty(processName: string): string {
  const factor = INDUSTRIAL_EMISSION_FACTORS.find(f => f.name === processName);
  return factor?.uncertainty_range || '±20%'; // Default uncertainty
}

// Get all available industries
export function getAvailableIndustries(): string[] {
  const industries = [...new Set(INDUSTRIAL_EMISSION_FACTORS.map(f => f.industry_sector))];
  return industries.sort();
}

// Get processes for a specific industry
export function getProcessesForIndustry(industrySector: string): string[] {
  const processes = INDUSTRIAL_EMISSION_FACTORS
    .filter(f => f.industry_sector.toLowerCase() === industrySector.toLowerCase())
    .map(f => f.process_type);
  
  return [...new Set(processes)].sort();
}