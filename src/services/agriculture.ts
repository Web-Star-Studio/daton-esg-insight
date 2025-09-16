import { supabase } from '@/integrations/supabase/client';

// GHG Protocol Brasil 2025.0.1 - Agriculture Emission Factors
export interface AgricultureEmissionFactor {
  id?: string;
  name: string;
  category: string;
  subcategory: string;
  ch4_factor?: number;
  n2o_factor?: number;
  co2_factor?: number;
  activity_unit: string;
  source: string;
  methodology: string;
  applicable_species?: string[];
  applicable_systems?: string[];
  biogenic_fraction?: number;
  reference_conditions?: string;
  uncertainty_range?: string;
}

// Agriculture Emission Factors from GHG Protocol Brasil 2025.0.1
export const AGRICULTURE_EMISSION_FACTORS: Omit<AgricultureEmissionFactor, 'id'>[] = [
  // ENTERIC FERMENTATION (Fermentação Entérica)
  {
    name: 'Bovinos de Leite - Fermentação Entérica',
    category: 'Agricultura',
    subcategory: 'Fermentação Entérica',
    ch4_factor: 128, // kg CH4/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Bovinos de Leite'],
    reference_conditions: 'Condições tropicais brasileiras',
    uncertainty_range: '±30%'
  },
  {
    name: 'Bovinos de Corte - Fermentação Entérica',
    category: 'Agricultura',
    subcategory: 'Fermentação Entérica',
    ch4_factor: 56, // kg CH4/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Bovinos de Corte'],
    reference_conditions: 'Condições tropicais brasileiras',
    uncertainty_range: '±30%'
  },
  {
    name: 'Búfalos - Fermentação Entérica',
    category: 'Agricultura',
    subcategory: 'Fermentação Entérica',
    ch4_factor: 55, // kg CH4/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Búfalos'],
    reference_conditions: 'Condições tropicais brasileiras',
    uncertainty_range: '±50%'
  },
  {
    name: 'Suínos - Fermentação Entérica',
    category: 'Agricultura',
    subcategory: 'Fermentação Entérica',
    ch4_factor: 1.5, // kg CH4/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Suínos'],
    reference_conditions: 'Peso médio 55kg',
    uncertainty_range: '±50%'
  },

  // MANURE MANAGEMENT (Manejo de Dejetos)
  {
    name: 'Bovinos - Manejo Dejetos Pasto',
    category: 'Agricultura',
    subcategory: 'Manejo de Dejetos',
    ch4_factor: 1.0, // kg CH4/cabeça/ano
    n2o_factor: 0.02, // kg N2O/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Bovinos'],
    applicable_systems: ['Pasto'],
    reference_conditions: 'Sistema extensivo',
    uncertainty_range: '±50%'
  },
  {
    name: 'Suínos - Manejo Dejetos Lagoa',
    category: 'Agricultura',
    subcategory: 'Manejo de Dejetos',
    ch4_factor: 28, // kg CH4/cabeça/ano
    n2o_factor: 0.05, // kg N2O/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Suínos'],
    applicable_systems: ['Lagoa'],
    reference_conditions: 'Sistema de lagoa anaeróbica',
    uncertainty_range: '±75%'
  },
  {
    name: 'Aves - Manejo Dejetos Sólido',
    category: 'Agricultura',
    subcategory: 'Manejo de Dejetos',
    ch4_factor: 0.02, // kg CH4/cabeça/ano
    n2o_factor: 0.001, // kg N2O/cabeça/ano
    activity_unit: 'cabeças',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_species: ['Aves'],
    applicable_systems: ['Sólido'],
    reference_conditions: 'Manejo seco',
    uncertainty_range: '±100%'
  },

  // RICE CULTIVATION (Cultivo de Arroz)
  {
    name: 'Arroz Irrigado Contínuo',
    category: 'Agricultura',
    subcategory: 'Cultivo de Arroz',
    ch4_factor: 200, // kg CH4/ha/ano
    activity_unit: 'ha',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_systems: ['Irrigado Contínuo'],
    reference_conditions: 'Inundação contínua',
    uncertainty_range: '±50%'
  },
  {
    name: 'Arroz Irrigado Intermitente',
    category: 'Agricultura',
    subcategory: 'Cultivo de Arroz',
    ch4_factor: 100, // kg CH4/ha/ano
    activity_unit: 'ha',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_systems: ['Irrigado Intermitente'],
    reference_conditions: 'Inundação intermitente',
    uncertainty_range: '±50%'
  },
  {
    name: 'Arroz de Sequeiro',
    category: 'Agricultura',
    subcategory: 'Cultivo de Arroz',
    ch4_factor: 0, // kg CH4/ha/ano - não produz CH4 significativo
    activity_unit: 'ha',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    applicable_systems: ['Sequeiro'],
    reference_conditions: 'Sem alagamento',
    uncertainty_range: 'N/A'
  },

  // AGRICULTURAL SOILS (Solos Agrícolas)
  {
    name: 'Fertilizantes Nitrogenados Sintéticos',
    category: 'Agricultura',
    subcategory: 'Solos Agrícolas',
    n2o_factor: 0.01, // kg N2O-N/kg N aplicado
    activity_unit: 'kg N',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    reference_conditions: 'Aplicação em solos agrícolas',
    uncertainty_range: '±75%'
  },
  {
    name: 'Fertilizantes Orgânicos',
    category: 'Agricultura',
    subcategory: 'Solos Agrícolas',
    n2o_factor: 0.01, // kg N2O-N/kg N aplicado
    activity_unit: 'kg N',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    reference_conditions: 'Estercos e compostos orgânicos',
    uncertainty_range: '±75%'
  },
  {
    name: 'Fixação Biológica de Nitrogênio',
    category: 'Agricultura',
    subcategory: 'Solos Agrícolas',
    n2o_factor: 0.01, // kg N2O-N/kg N fixado
    activity_unit: 'kg N',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    reference_conditions: 'Leguminosas fixadoras',
    uncertainty_range: '±75%'
  },

  // CROP RESIDUE BURNING (Queima de Resíduos)
  {
    name: 'Queima Cana-de-açúcar',
    category: 'Agricultura',
    subcategory: 'Queima de Resíduos',
    co2_factor: 1515, // kg CO2/t biomassa queimada (BIOGÊNICO)
    ch4_factor: 2.7, // kg CH4/t biomassa queimada
    n2o_factor: 0.07, // kg N2O/t biomassa queimada
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    biogenic_fraction: 1.0, // CO2 é 100% biogênico
    reference_conditions: 'Queima controlada no campo',
    uncertainty_range: '±50%'
  },
  {
    name: 'Queima Resíduos Cereais',
    category: 'Agricultura',
    subcategory: 'Queima de Resíduos',
    co2_factor: 1515, // kg CO2/t biomassa queimada (BIOGÊNICO)
    ch4_factor: 2.3, // kg CH4/t biomassa queimada
    n2o_factor: 0.07, // kg N2O/t biomassa queimada
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    biogenic_fraction: 1.0, // CO2 é 100% biogênico
    reference_conditions: 'Trigo, arroz, milho, etc.',
    uncertainty_range: '±50%'
  },

  // LIMING (Calcagem)
  {
    name: 'Aplicação de Calcário',
    category: 'Agricultura',
    subcategory: 'Calcagem',
    co2_factor: 0.12, // kg CO2/kg calcário
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    biogenic_fraction: 0, // CO2 é fóssil/mineral
    reference_conditions: 'CaCO3 puro',
    uncertainty_range: '±10%'
  },

  // UREA APPLICATION (Aplicação de Ureia)
  {
    name: 'Aplicação de Ureia',
    category: 'Agricultura',
    subcategory: 'Aplicação de Ureia',
    co2_factor: 0.733, // kg CO2/kg ureia
    activity_unit: 't',
    source: 'GHG Protocol Brasil 2025.0.1',
    methodology: 'Tier 1',
    biogenic_fraction: 0, // CO2 é não-biogênico
    reference_conditions: 'CO(NH2)2 → CO2 + 2NH3',
    uncertainty_range: '±10%'
  }
];

// Get emission factor by subcategory and species/system
export function getAgricultureEmissionFactor(
  subcategory: string,
  species?: string,
  system?: string
): Omit<AgricultureEmissionFactor, 'id'> | undefined {
  return AGRICULTURE_EMISSION_FACTORS.find(factor => {
    const subcategoryMatch = factor.subcategory.toLowerCase() === subcategory.toLowerCase();
    const speciesMatch = !species || !factor.applicable_species || 
                        factor.applicable_species.some(s => s.toLowerCase().includes(species.toLowerCase()));
    const systemMatch = !system || !factor.applicable_systems || 
                       factor.applicable_systems.some(s => s.toLowerCase().includes(system.toLowerCase()));
    
    return subcategoryMatch && speciesMatch && systemMatch;
  });
}

// Get all emission factors for a subcategory
export function getEmissionFactorsBySubcategory(
  subcategory: string
): Omit<AgricultureEmissionFactor, 'id'>[] {
  return AGRICULTURE_EMISSION_FACTORS.filter(factor => 
    factor.subcategory.toLowerCase() === subcategory.toLowerCase()
  );
}

// Calculate agriculture emissions according to GHG Protocol Brasil
export function calculateAgricultureEmissions(
  subcategory: string,
  activityData: {
    animalCount?: number;
    species?: string;
    manureSystem?: string;
    cultivatedArea?: number;
    riceType?: string;
    nitrogenAmount?: number;
    fertilizerType?: string;
    residueAmount?: number;
    cropType?: string;
    burningEfficiency?: number;
    limestoneAmount?: number;
    ureaAmount?: number;
  }
): {
  fossil_co2e: number;
  biogenic_co2e: number;
  raw_co2: number;
  raw_ch4: number;
  raw_n2o: number;
  total_co2e: number;
  calculation_details: any;
} {
  let emissionFactor: Omit<AgricultureEmissionFactor, 'id'> | undefined;
  
  // Find appropriate emission factor
  switch (subcategory.toLowerCase()) {
    case 'fermentacao_enterica':
    case 'fermentação entérica':
      emissionFactor = getAgricultureEmissionFactor('Fermentação Entérica', activityData.species);
      break;
    case 'manejo_dejetos':
    case 'manejo de dejetos':
      emissionFactor = getAgricultureEmissionFactor('Manejo de Dejetos', activityData.species, activityData.manureSystem);
      break;
    case 'cultivo_arroz':
    case 'cultivo de arroz':
      emissionFactor = getAgricultureEmissionFactor('Cultivo de Arroz', undefined, activityData.riceType);
      break;
    case 'solos_agricolas':
    case 'solos agrícolas':
      emissionFactor = getAgricultureEmissionFactor('Solos Agrícolas');
      break;
    case 'queima_residuos':
    case 'queima de resíduos':
      emissionFactor = getAgricultureEmissionFactor('Queima de Resíduos');
      break;
    case 'calcagem':
      emissionFactor = getAgricultureEmissionFactor('Calcagem');
      break;
    case 'ureia':
    case 'aplicação de ureia':
      emissionFactor = getAgricultureEmissionFactor('Aplicação de Ureia');
      break;
    default:
      throw new Error(`Subcategoria "${subcategory}" não encontrada`);
  }

  if (!emissionFactor) {
    throw new Error(`Fator de emissão não encontrado para ${subcategory}`);
  }

  // GWP values from AR4 (GHG Protocol Brasil standard)
  const GWP_CH4 = 25;
  const GWP_N2O = 298;

  let calculation_details: any = {
    emission_factor_used: emissionFactor.name,
    subcategory: subcategory,
    methodology: emissionFactor.methodology,
    source: emissionFactor.source,
    gwp_ch4: GWP_CH4,
    gwp_n2o: GWP_N2O,
  };

  let rawCO2 = 0;
  let rawCH4 = 0;
  let rawN2O = 0;
  let activityQuantity = 0;

  // Calculate emissions based on subcategory
  switch (subcategory.toLowerCase()) {
    case 'fermentacao_enterica':
    case 'fermentação entérica':
      if (!activityData.animalCount) throw new Error('Número de animais é obrigatório');
      activityQuantity = activityData.animalCount;
      rawCH4 = (activityData.animalCount * (emissionFactor.ch4_factor || 0)) / 1000; // Convert kg to tonnes
      calculation_details.animal_count = activityData.animalCount;
      calculation_details.ch4_factor = emissionFactor.ch4_factor;
      break;

    case 'manejo_dejetos':
    case 'manejo de dejetos':
      if (!activityData.animalCount) throw new Error('Número de animais é obrigatório');
      activityQuantity = activityData.animalCount;
      rawCH4 = (activityData.animalCount * (emissionFactor.ch4_factor || 0)) / 1000;
      rawN2O = (activityData.animalCount * (emissionFactor.n2o_factor || 0)) / 1000;
      calculation_details.animal_count = activityData.animalCount;
      calculation_details.manure_system = activityData.manureSystem;
      break;

    case 'cultivo_arroz':
    case 'cultivo de arroz':
      if (!activityData.cultivatedArea) throw new Error('Área cultivada é obrigatória');
      activityQuantity = activityData.cultivatedArea;
      rawCH4 = (activityData.cultivatedArea * (emissionFactor.ch4_factor || 0)) / 1000;
      calculation_details.cultivated_area = activityData.cultivatedArea;
      calculation_details.rice_type = activityData.riceType;
      break;

    case 'solos_agricolas':
    case 'solos agrícolas':
      if (!activityData.nitrogenAmount) throw new Error('Quantidade de nitrogênio é obrigatória');
      activityQuantity = activityData.nitrogenAmount;
      // N2O-N to N2O conversion: multiply by 44/28
      rawN2O = (activityData.nitrogenAmount * (emissionFactor.n2o_factor || 0) * 44/28) / 1000;
      calculation_details.nitrogen_amount = activityData.nitrogenAmount;
      calculation_details.fertilizer_type = activityData.fertilizerType;
      break;

    case 'queima_residuos':
    case 'queima de resíduos':
      if (!activityData.residueAmount) throw new Error('Quantidade de resíduo é obrigatória');
      activityQuantity = activityData.residueAmount;
      const efficiency = (activityData.burningEfficiency || 90) / 100;
      rawCO2 = activityData.residueAmount * (emissionFactor.co2_factor || 0) * efficiency / 1000;
      rawCH4 = activityData.residueAmount * (emissionFactor.ch4_factor || 0) * efficiency / 1000;
      rawN2O = activityData.residueAmount * (emissionFactor.n2o_factor || 0) * efficiency / 1000;
      calculation_details.residue_amount = activityData.residueAmount;
      calculation_details.burning_efficiency = efficiency;
      calculation_details.crop_type = activityData.cropType;
      break;

    case 'calcagem':
      if (!activityData.limestoneAmount) throw new Error('Quantidade de calcário é obrigatória');
      activityQuantity = activityData.limestoneAmount;
      rawCO2 = activityData.limestoneAmount * (emissionFactor.co2_factor || 0);
      calculation_details.limestone_amount = activityData.limestoneAmount;
      break;

    case 'ureia':
    case 'aplicação de ureia':
      if (!activityData.ureaAmount) throw new Error('Quantidade de ureia é obrigatória');
      activityQuantity = activityData.ureaAmount;
      rawCO2 = activityData.ureaAmount * (emissionFactor.co2_factor || 0);
      calculation_details.urea_amount = activityData.ureaAmount;
      break;
  }

  // Separate biogenic and fossil CO2
  const biogenic_fraction = emissionFactor.biogenic_fraction || 0;
  const biogenic_co2 = rawCO2 * biogenic_fraction;
  const fossil_co2 = rawCO2 * (1 - biogenic_fraction);

  // Calculate CO2e
  const fossil_co2e = fossil_co2 + (rawCH4 * GWP_CH4) + (rawN2O * GWP_N2O);
  const biogenic_co2e = biogenic_co2; // Biogenic CO2 has GWP of 1

  calculation_details = {
    ...calculation_details,
    activity_quantity: activityQuantity,
    raw_emissions: {
      co2: rawCO2,
      ch4: rawCH4,
      n2o: rawN2O
    },
    biogenic_fraction: biogenic_fraction,
    fossil_co2: fossil_co2,
    biogenic_co2: biogenic_co2,
    ch4_co2e: rawCH4 * GWP_CH4,
    n2o_co2e: rawN2O * GWP_N2O,
  };

  return {
    fossil_co2e: Math.round(fossil_co2e * 1000) / 1000,
    biogenic_co2e: Math.round(biogenic_co2e * 1000) / 1000,
    raw_co2: Math.round(rawCO2 * 1000) / 1000,
    raw_ch4: Math.round(rawCH4 * 1000) / 1000,
    raw_n2o: Math.round(rawN2O * 1000) / 1000,
    total_co2e: Math.round((fossil_co2e + biogenic_co2e) * 1000) / 1000,
    calculation_details
  };
}

// Import agriculture emission factors into database
export async function importAgricultureEmissionFactors(): Promise<{success: number; errors: string[]}> {
  const errors: string[] = [];
  let success = 0;

  try {
    for (const factor of AGRICULTURE_EMISSION_FACTORS) {
      // Check if factor already exists
      const { data: existingFactor } = await supabase
        .from('emission_factors')
        .select('id')
        .eq('name', factor.name)
        .eq('category', factor.category)
        .eq('source', factor.source)
        .eq('type', 'system')
        .single();

      let error;
      if (existingFactor) {
        // Update existing factor
        const updateResult = await supabase
          .from('emission_factors')
          .update({
            activity_unit: factor.activity_unit,
            co2_factor: factor.co2_factor,
            ch4_factor: factor.ch4_factor,
            n2o_factor: factor.n2o_factor,
            biogenic_fraction: factor.biogenic_fraction,
            details_json: {
              subcategory: factor.subcategory,
              methodology: factor.methodology,
              applicable_species: factor.applicable_species,
              applicable_systems: factor.applicable_systems,
              reference_conditions: factor.reference_conditions,
              uncertainty_range: factor.uncertainty_range
            },
            validation_status: 'validated'
          })
          .eq('id', existingFactor.id);
        error = updateResult.error;
      } else {
        // Insert new factor
        const insertResult = await supabase
          .from('emission_factors')
          .insert({
            name: factor.name,
            category: factor.category,
            source: factor.source,
            activity_unit: factor.activity_unit,
            co2_factor: factor.co2_factor,
            ch4_factor: factor.ch4_factor,
            n2o_factor: factor.n2o_factor,
            biogenic_fraction: factor.biogenic_fraction,
            details_json: {
              subcategory: factor.subcategory,
              methodology: factor.methodology,
              applicable_species: factor.applicable_species,
              applicable_systems: factor.applicable_systems,
              reference_conditions: factor.reference_conditions,
              uncertainty_range: factor.uncertainty_range
            },
            type: 'system',
            validation_status: 'validated'
          });
        error = insertResult.error;
      }

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

// Get available livestock species
export function getAvailableLivestockSpecies(): string[] {
  const species = AGRICULTURE_EMISSION_FACTORS
    .filter(f => f.subcategory === 'Fermentação Entérica' && f.applicable_species)
    .flatMap(f => f.applicable_species || []);
  
  return [...new Set(species)].sort();
}

// Get available manure management systems
export function getAvailableManureSystems(): string[] {
  const systems = AGRICULTURE_EMISSION_FACTORS
    .filter(f => f.subcategory === 'Manejo de Dejetos' && f.applicable_systems)
    .flatMap(f => f.applicable_systems || []);
  
  return [...new Set(systems)].sort();
}

// Get available rice cultivation systems
export function getAvailableRiceSystems(): string[] {
  const systems = AGRICULTURE_EMISSION_FACTORS
    .filter(f => f.subcategory === 'Cultivo de Arroz' && f.applicable_systems)
    .flatMap(f => f.applicable_systems || []);
  
  return [...new Set(systems)].sort();
}

// Validate if emission factor is appropriate for the activity
export function validateAgricultureEmissionFactor(
  subcategory: string,
  species?: string,
  system?: string
): boolean {
  const factor = getAgricultureEmissionFactor(subcategory, species, system);
  return factor !== undefined;
}

// Get uncertainty range for a specific factor
export function getUncertaintyRange(subcategory: string, species?: string, system?: string): string {
  const factor = getAgricultureEmissionFactor(subcategory, species, system);
  return factor?.uncertainty_range || '±50%'; // Default uncertainty
}

// Check if a subcategory produces biogenic emissions
export function isBiogenicEmission(subcategory: string): boolean {
  const factors = getEmissionFactorsBySubcategory(subcategory);
  return factors.some(f => (f.biogenic_fraction || 0) > 0);
}