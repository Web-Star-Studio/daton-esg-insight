import { supabase } from '@/integrations/supabase/client';

// GHG Protocol Brasil 2025.0.1 - Mobile Combustion Types
export interface MobileFuel {
  id?: string;
  name: string;
  fuel_type: 'Liquid' | 'Gas' | 'Solid';
  calorific_value: number;
  calorific_value_unit: string;
  co2_factor: number;
  ch4_factor: number;
  n2o_factor: number;
  biogenic_fraction: number;
  category: string;
  source: string;
  activity_unit: string;
  transport_mode: 'Rodoviário' | 'Aéreo' | 'Ferroviário' | 'Hidroviário' | 'Dutoviário';
  vehicle_category?: string;
  economic_sectors?: string[];
}

// Mobile Combustion Fuels from GHG Protocol Brasil 2025.0.1
export const MOBILE_FUELS: Omit<MobileFuel, 'id'>[] = [
  // Rodoviário
  {
    name: 'Gasolina C',
    fuel_type: 'Liquid',
    calorific_value: 32.2,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 69300,
    ch4_factor: 25,
    n2o_factor: 8,
    biogenic_fraction: 0.27, // 27% etanol anidro
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Automóvel',
    economic_sectors: ['Todos os setores']
  },
  {
    name: 'Etanol Hidratado',
    fuel_type: 'Liquid',
    calorific_value: 21.1,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 0, // Biocombustível - emissão zero para CO2 fóssil
    ch4_factor: 25,
    n2o_factor: 8,
    biogenic_fraction: 1.0, // 100% biogênico
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Automóvel',
    economic_sectors: ['Todos os setores']
  },
  {
    name: 'Diesel S10',
    fuel_type: 'Liquid',
    calorific_value: 43.0,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 74100,
    ch4_factor: 10,
    n2o_factor: 3,
    biogenic_fraction: 0.10, // 10% biodiesel
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Caminhão',
    economic_sectors: ['Todos os setores']
  },
  {
    name: 'Diesel S500',
    fuel_type: 'Liquid',
    calorific_value: 43.0,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 74100,
    ch4_factor: 10,
    n2o_factor: 3,
    biogenic_fraction: 0.10, // 10% biodiesel
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Caminhão',
    economic_sectors: ['Todos os setores']
  },
  {
    name: 'Biodiesel B100',
    fuel_type: 'Liquid',
    calorific_value: 37.0,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 0, // Biocombustível - emissão zero para CO2 fóssil
    ch4_factor: 10,
    n2o_factor: 3,
    biogenic_fraction: 1.0, // 100% biogênico
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Caminhão',
    economic_sectors: ['Todos os setores']
  },
  {
    name: 'GNV (Gás Natural Veicular)',
    fuel_type: 'Gas',
    calorific_value: 48.0,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 56100,
    ch4_factor: 92,
    n2o_factor: 3,
    biogenic_fraction: 0,
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'm3',
    transport_mode: 'Rodoviário',
    vehicle_category: 'Automóvel',
    economic_sectors: ['Todos os setores']
  },
  // Aéreo
  {
    name: 'Querosene de Aviação',
    fuel_type: 'Liquid',
    calorific_value: 43.15,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 71500,
    ch4_factor: 0.5,
    n2o_factor: 2,
    biogenic_fraction: 0,
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Aéreo',
    vehicle_category: 'Aeronave Comercial',
    economic_sectors: ['Todos os setores']
  },
  // Hidroviário
  {
    name: 'Óleo Combustível Marítimo',
    fuel_type: 'Liquid',
    calorific_value: 40.4,
    calorific_value_unit: 'TJ/Gg',
    co2_factor: 77400,
    ch4_factor: 7,
    n2o_factor: 2,
    biogenic_fraction: 0,
    category: 'Combustão Móvel',
    source: 'GHG Protocol Brasil 2025.0.1',
    activity_unit: 'L',
    transport_mode: 'Hidroviário',
    vehicle_category: 'Embarcação',
    economic_sectors: ['Todos os setores']
  }
];

export const ECONOMIC_SECTORS = [
  'Todos os setores',
  'Agropecuária',
  'Mineração',
  'Indústria de Transformação',
  'Eletricidade e Gás',
  'Construção',
  'Comércio e Reparação',
  'Transporte e Armazenagem',
  'Alojamento e Alimentação',
  'Informação e Comunicação',
  'Atividades Financeiras',
  'Atividades Imobiliárias',
  'Atividades Profissionais',
  'Atividades Administrativas',
  'Administração Pública',
  'Educação',
  'Saúde Humana',
  'Artes e Recreação',
  'Outras Atividades de Serviços',
  'Serviços Domésticos',
  'Organismos Internacionais'
] as const;

export type EconomicSector = typeof ECONOMIC_SECTORS[number];

// Get mobile fuels by transport mode
export function getFuelsByTransportMode(mode: string): Omit<MobileFuel, 'id'>[] {
  return MOBILE_FUELS.filter(fuel => fuel.transport_mode === mode);
}

// Get fuel by name with fuzzy matching
export function getFuelByName(name: string): Omit<MobileFuel, 'id'> | undefined {
  // Exact match first
  let fuel = MOBILE_FUELS.find(f => f.name === name);
  if (fuel) return fuel;
  
  // Case insensitive match
  fuel = MOBILE_FUELS.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (fuel) return fuel;
  
  // Partial match
  fuel = MOBILE_FUELS.find(f => 
    f.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(f.name.toLowerCase())
  );
  
  return fuel;
}

// Calculate mobile combustion emissions according to GHG Protocol Brasil
export function calculateMobileCombustionEmissions(
  fuelName: string,
  quantity: number,
  activityUnit: string,
  transportMode: string,
  calculationMethod: 'fuel' | 'distance' | 'airport' = 'fuel'
): {
  fossil_co2e: number;
  biogenic_co2e: number;
  raw_co2: number;
  raw_ch4: number;
  raw_n2o: number;
  total_co2e: number;
  calculation_details: any;
} {
  const fuel = getFuelByName(fuelName);
  if (!fuel) {
    throw new Error(`Combustível "${fuelName}" não encontrado na base de dados GHG Protocol Brasil 2025.0.1`);
  }

  // GWP values from AR4 (GHG Protocol Brasil standard)
  const GWP_CH4 = 25;
  const GWP_N2O = 298;

  let calculation_details: any = {
    fuel_used: fuel.name,
    transport_mode: transportMode,
    calculation_method: calculationMethod,
    quantity: quantity,
    activity_unit: activityUnit,
    conversion_applied: false,
    biogenic_fraction: fuel.biogenic_fraction,
    gwp_ch4: GWP_CH4,
    gwp_n2o: GWP_N2O,
  };

  // For mobile combustion, we primarily use fuel consumption method
  // Distance and airport methods would require specific emission factors per km or per flight
  
  let finalQuantity = quantity;
  
  // Unit conversion if needed (simplified - in real implementation, use conversion_factors table)
  if (activityUnit !== fuel.activity_unit) {
    // Basic conversions - extend as needed
    if (activityUnit === 't' && fuel.activity_unit === 'L') {
      // Approximate density conversion for liquid fuels
      const density = fuel.fuel_type === 'Liquid' ? 0.8 : 1.0; // kg/L
      finalQuantity = quantity * 1000 / density; // Convert tonnes to liters
      calculation_details.conversion_applied = true;
      calculation_details.density_used = density;
    }
  }

  // Convert quantity to mass (Gg) for calculation
  let quantityInGg: number;
  if (fuel.activity_unit === 'L') {
    // Liquid fuels: convert liters to Gg using density
    const density = fuel.fuel_type === 'Liquid' ? 0.8 : 1.0; // kg/L (simplified)
    quantityInGg = (finalQuantity * density) / 1_000_000; // L * kg/L / 1,000,000 = Gg
  } else if (fuel.activity_unit === 'm3') {
    // Gas fuels: convert m³ to Gg using density at standard conditions
    const density = 0.72; // kg/m³ for natural gas (simplified)
    quantityInGg = (finalQuantity * density) / 1_000_000;
  } else {
    // Already in mass units
    quantityInGg = finalQuantity / 1000; // Convert to Gg
  }

  // Calculate raw emissions (kg)
  const raw_co2 = (quantityInGg * fuel.co2_factor) / 1000; // Convert from kg to tonnes
  const raw_ch4 = (quantityInGg * fuel.ch4_factor) / 1000;
  const raw_n2o = (quantityInGg * fuel.n2o_factor) / 1000;

  // Separate fossil and biogenic CO2
  const fossil_co2 = raw_co2 * (1 - fuel.biogenic_fraction);
  const biogenic_co2 = raw_co2 * fuel.biogenic_fraction;

  // Calculate CO2e
  const fossil_co2e = fossil_co2 + (raw_ch4 * GWP_CH4) + (raw_n2o * GWP_N2O);
  const biogenic_co2e = biogenic_co2; // Biogenic CO2 has GWP of 1

  calculation_details = {
    ...calculation_details,
    quantity_in_gg: quantityInGg,
    fossil_co2: fossil_co2,
    biogenic_co2: biogenic_co2,
    ch4_co2e: raw_ch4 * GWP_CH4,
    n2o_co2e: raw_n2o * GWP_N2O,
  };

  return {
    fossil_co2e: Math.round(fossil_co2e * 1000) / 1000, // Round to 3 decimal places
    biogenic_co2e: Math.round(biogenic_co2e * 1000) / 1000,
    raw_co2: Math.round(raw_co2 * 1000) / 1000,
    raw_ch4: Math.round(raw_ch4 * 1000) / 1000,
    raw_n2o: Math.round(raw_n2o * 1000) / 1000,
    total_co2e: Math.round((fossil_co2e + biogenic_co2e) * 1000) / 1000,
    calculation_details
  };
}

// Import mobile fuels into database
export async function importMobileFuels(): Promise<{success: number; errors: string[]}> {
  const errors: string[] = [];
  let success = 0;

  try {
    for (const fuel of MOBILE_FUELS) {
      const { error } = await supabase
        .from('emission_factors')
        .upsert({
          name: fuel.name,
          category: fuel.category,
          source: fuel.source,
          activity_unit: fuel.activity_unit,
          co2_factor: fuel.co2_factor,
          ch4_factor: fuel.ch4_factor,
          n2o_factor: fuel.n2o_factor,
          calorific_value: fuel.calorific_value,
          calorific_value_unit: fuel.calorific_value_unit,
          biogenic_fraction: fuel.biogenic_fraction,
          fuel_type: fuel.fuel_type,
          details_json: {
            transport_mode: fuel.transport_mode,
            vehicle_category: fuel.vehicle_category,
            economic_sectors: fuel.economic_sectors
          },
          type: 'system',
          validation_status: 'validated'
        }, {
          onConflict: 'name,category,source'
        });

      if (error) {
        errors.push(`Erro ao importar ${fuel.name}: ${error.message}`);
      } else {
        success++;
      }
    }
  } catch (error: any) {
    errors.push(`Erro geral na importação: ${error.message}`);
  }

  return { success, errors };
}

// Validate if fuel is appropriate for transport mode
export function validateFuelForTransportMode(fuelName: string, transportMode: string): boolean {
  const fuel = getFuelByName(fuelName);
  return fuel ? fuel.transport_mode === transportMode : false;
}

// Get recommended units for a fuel
export function getRecommendedUnitsForFuel(fuelName: string): string[] {
  const fuel = getFuelByName(fuelName);
  if (!fuel) return ['L'];

  switch (fuel.fuel_type) {
    case 'Liquid':
      return ['L', 't', 'kg'];
    case 'Gas':
      return ['m3', 'kg', 't'];
    case 'Solid':
      return ['kg', 't'];
    default:
      return ['L'];
  }
}