import { supabase } from "@/integrations/supabase/client";
import { getConversionFactor } from "./conversionFactors";

export interface StationaryFuel {
  id: string;
  name: string;
  fuel_type: string;
  calorific_value: number;
  calorific_value_unit: string;
  density?: number;
  density_unit?: string;
  co2_factor: number;
  ch4_factor: number;
  n2o_factor: number;
  is_biofuel: boolean;
  biogenic_fraction: number;
  activity_unit: string;
  economic_sectors: string[];
  source: string;
}

// Fatores de emissão de combustão estacionária do GHG Protocol Brasil 2025.0.1
export const STATIONARY_FUELS: Omit<StationaryFuel, 'id'>[] = [
  // COMBUSTÍVEIS LÍQUIDOS
  {
    name: "Óleo Diesel",
    fuel_type: "Líquido",
    calorific_value: 42.6,
    calorific_value_unit: "TJ/Gg",
    density: 0.84,
    density_unit: "kg/L",
    co2_factor: 74.1,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo Diesel Comercial (B12)",
    fuel_type: "Líquido",
    calorific_value: 42.6,
    calorific_value_unit: "TJ/Gg", 
    density: 0.84,
    density_unit: "kg/L",
    co2_factor: 65.2,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0.12,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo Combustível 1A",
    fuel_type: "Líquido",
    calorific_value: 41.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.95,
    density_unit: "kg/L",
    co2_factor: 77.4,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo Combustível 2A",
    fuel_type: "Líquido",
    calorific_value: 40.4,
    calorific_value_unit: "TJ/Gg",
    density: 0.98,
    density_unit: "kg/L",
    co2_factor: 77.4,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gasolina",
    fuel_type: "Líquido",
    calorific_value: 44.3,
    calorific_value_unit: "TJ/Gg",
    density: 0.75,
    density_unit: "kg/L",
    co2_factor: 69.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gasolina Comercial (E27)",
    fuel_type: "Líquido",
    calorific_value: 42.4,
    calorific_value_unit: "TJ/Gg",
    density: 0.75,
    density_unit: "kg/L",
    co2_factor: 50.6,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0.27,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Querosene",
    fuel_type: "Líquido",
    calorific_value: 43.8,
    calorific_value_unit: "TJ/Gg",
    density: 0.81,
    density_unit: "kg/L",
    co2_factor: 71.9,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "GLP (Gás Liquefeito de Petróleo)",
    fuel_type: "Gás",
    calorific_value: 47.3,
    calorific_value_unit: "TJ/Gg",
    density: 0.54,
    density_unit: "kg/L",
    co2_factor: 63.1,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Residencial"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Etanol",
    fuel_type: "Líquido",
    calorific_value: 26.8,
    calorific_value_unit: "TJ/Gg",
    density: 0.79,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Biodiesel",
    fuel_type: "Líquido",
    calorific_value: 37.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.88,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },

  // COMBUSTÍVEIS GASOSOS
  {
    name: "Gás Natural",
    fuel_type: "Gás",
    calorific_value: 48.0,
    calorific_value_unit: "TJ/Gg",
    density: 0.001,
    density_unit: "kg/m³",
    co2_factor: 56.1,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Residencial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },

  // COMBUSTÍVEIS SÓLIDOS - CARVÃO
  {
    name: "Carvão Mineral - Antracito",
    fuel_type: "Sólido",
    calorific_value: 26.7,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 98.3,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Mineral - Betuminoso",
    fuel_type: "Sólido", 
    calorific_value: 25.8,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 94.6,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Mineral - Sub-betuminoso",
    fuel_type: "Sólido",
    calorific_value: 18.9,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Mineral - Linhito",
    fuel_type: "Sólido",
    calorific_value: 15.3,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 101.2,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Coque de Carvão Mineral",
    fuel_type: "Sólido",
    calorific_value: 28.2,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 107.0,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Industrial"],
    source: "GHG Protocol Brasil 2025.0.1"
  },

  // BIOMASSA 
  {
    name: "Lenha",
    fuel_type: "Sólido",
    calorific_value: 15.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 300,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário", "Residencial"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vegetal",
    fuel_type: "Sólido",
    calorific_value: 29.7,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 200,
    n2o_factor: 1,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Comercial/Institucional", "Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Bagaço de Cana-de-açúcar",
    fuel_type: "Sólido",
    calorific_value: 9.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Agropecuário", "Geração de Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Casca de Arroz",
    fuel_type: "Sólido",
    calorific_value: 13.8,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Industrial", "Agropecuário"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Resíduo de Madeira",
    fuel_type: "Sólido",
    calorific_value: 15.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Comercial/Institucional", "Industrial"],
    source: "GHG Protocol Brasil 2025.0.1"
  }
];

// Economic sectors available
export const ECONOMIC_SECTORS = [
  "Comercial/Institucional",
  "Industrial", 
  "Agropecuário",
  "Residencial",
  "Geração de Energia"
] as const;

export type EconomicSector = typeof ECONOMIC_SECTORS[number];

// Get fuels by economic sector
export function getFuelsByEconomicSector(sector: EconomicSector): Omit<StationaryFuel, 'id'>[] {
  return STATIONARY_FUELS.filter(fuel => fuel.economic_sectors.includes(sector));
}

// Get fuel by name
export function getFuelByName(name: string): Omit<StationaryFuel, 'id'> | undefined {
  return STATIONARY_FUELS.find(fuel => fuel.name === name);
}

// Calculate stationary combustion emissions with fossil/biogenic separation
export async function calculateStationaryCombustionEmissions(
  fuelName: string,
  quantity: number,
  activityUnit: string,
  economicSector: EconomicSector
): Promise<{
  fossil_co2e: number;
  biogenic_co2e: number;
  total_co2e: number;
  co2_emissions: number;
  ch4_emissions: number;
  n2o_emissions: number;
  calculation_details: any;
}> {
  
  const fuel = getFuelByName(fuelName);
  if (!fuel) {
    throw new Error(`Combustível não encontrado: ${fuelName}`);
  }

  // Validate economic sector compatibility
  if (!fuel.economic_sectors.includes(economicSector)) {
    throw new Error(`Combustível ${fuelName} não é compatível com setor ${economicSector}`);
  }

  // Convert quantity to mass (kg) if needed
  let massKg = quantity;
  
  if (activityUnit !== 'kg') {
    // Convert using density or conversion factors
    if (activityUnit === 'L' && fuel.density) {
      massKg = quantity * fuel.density;
    } else if (activityUnit === 'm³') {
      if (fuel.density) {
        massKg = quantity * fuel.density * 1000; // m³ to L then to kg
      } else {
        // For gases like natural gas, use standard conversion
        const conversionFactor = await getConversionFactor(activityUnit, 'kg', fuel.fuel_type);
        massKg = quantity * conversionFactor;
      }
    } else {
      // Try to get conversion factor from database
      const conversionFactor = await getConversionFactor(activityUnit, 'kg', fuel.fuel_type);
      massKg = quantity * conversionFactor;
    }
  }

  // Convert mass to Gg (gigagrams) for calculation
  const massGg = massKg / 1000000;

  // Calculate emissions in Gg CO2, CH4, N2O
  const co2_emissions = massGg * fuel.calorific_value * fuel.co2_factor / 1000; // tCO2
  const ch4_emissions = massGg * fuel.calorific_value * fuel.ch4_factor / 1000000; // tCH4 
  const n2o_emissions = massGg * fuel.calorific_value * fuel.n2o_factor / 1000000; // tN2O

  // GWP factors IPCC AR6
  const gwpCH4 = fuel.is_biofuel ? 27 : 30; // Different GWP for fossil vs biogenic CH4
  const gwpN2O = 273;

  // Convert to CO2 equivalent
  const ch4_co2e = ch4_emissions * gwpCH4;
  const n2o_co2e = n2o_emissions * gwpN2O;

  // Separate fossil and biogenic emissions
  const fossil_fraction = 1 - fuel.biogenic_fraction;
  const biogenic_fraction = fuel.biogenic_fraction;

  const fossil_co2e = (co2_emissions * fossil_fraction) + ch4_co2e + n2o_co2e;
  const biogenic_co2e = co2_emissions * biogenic_fraction;
  const total_co2e = fossil_co2e + biogenic_co2e;

  const calculation_details = {
    fuel_name: fuelName,
    economic_sector: economicSector,
    input_quantity: quantity,
    input_unit: activityUnit,
    mass_kg: massKg,
    mass_gg: massGg,
    calorific_value: fuel.calorific_value,
    calorific_value_unit: fuel.calorific_value_unit,
    emission_factors: {
      co2: fuel.co2_factor,
      ch4: fuel.ch4_factor,
      n2o: fuel.n2o_factor
    },
    gwp_factors: {
      ch4: gwpCH4,
      n2o: gwpN2O
    },
    biogenic_fraction: fuel.biogenic_fraction,
    fossil_fraction,
    raw_emissions: {
      co2: co2_emissions,
      ch4: ch4_emissions,
      n2o: n2o_emissions
    },
    co2e_breakdown: {
      fossil_co2: co2_emissions * fossil_fraction,
      biogenic_co2: co2_emissions * biogenic_fraction,
      ch4_co2e,
      n2o_co2e
    }
  };

  return {
    fossil_co2e: Math.round(fossil_co2e * 1000) / 1000, // Round to 3 decimal places
    biogenic_co2e: Math.round(biogenic_co2e * 1000) / 1000,
    total_co2e: Math.round(total_co2e * 1000) / 1000,
    co2_emissions: Math.round(co2_emissions * 1000) / 1000,
    ch4_emissions: Math.round(ch4_emissions * 1000000) / 1000000, // Keep in tonnes
    n2o_emissions: Math.round(n2o_emissions * 1000000) / 1000000,
    calculation_details
  };
}

// Import stationary combustion fuels to database
export async function importStationaryFuels(): Promise<{success: number; errors: string[]}> {
  let successCount = 0;
  const errors: string[] = [];

  for (const fuel of STATIONARY_FUELS) {
    try {
      const { error } = await supabase
        .from('emission_factors')
        .upsert({
          name: fuel.name,
          category: 'Combustão Estacionária',
          activity_unit: fuel.activity_unit,
          co2_factor: fuel.co2_factor,
          ch4_factor: fuel.ch4_factor,
          n2o_factor: fuel.n2o_factor,
          source: fuel.source,
          year_of_validity: 2025,
          type: 'system',
          fuel_type: fuel.fuel_type,
          is_biofuel: fuel.is_biofuel,
          calorific_value: fuel.calorific_value,
          calorific_value_unit: fuel.calorific_value_unit,
          density: fuel.density,
          density_unit: fuel.density_unit,
          biogenic_fraction: fuel.biogenic_fraction,
          details_json: {
            economic_sectors: fuel.economic_sectors,
            fuel_properties: {
              calorific_value: fuel.calorific_value,
              calorific_value_unit: fuel.calorific_value_unit,
              density: fuel.density,
              density_unit: fuel.density_unit
            }
          }
        }, {
          onConflict: 'name,category,source'
        });

      if (error) {
        errors.push(`Erro ao importar ${fuel.name}: ${error.message}`);
      } else {
        successCount++;
      }
    } catch (error) {
      errors.push(`Erro ao importar ${fuel.name}: ${error}`);
    }
  }

  return {
    success: successCount,
    errors
  };
}

// Validate fuel selection for sector
export function validateFuelForSector(fuelName: string, sector: EconomicSector): boolean {
  const fuel = getFuelByName(fuelName);
  return fuel ? fuel.economic_sectors.includes(sector) : false;
}

// Get recommended units for fuel
export function getRecommendedUnitsForFuel(fuelName: string): string[] {
  const fuel = getFuelByName(fuelName);
  if (!fuel) return ['kg'];

  const baseUnit = fuel.activity_unit;
  const units = [baseUnit];

  // Add common alternative units based on fuel type
  if (fuel.fuel_type === 'Líquido') {
    if (!units.includes('L')) units.push('L');
    if (!units.includes('m³')) units.push('m³');
  } else if (fuel.fuel_type === 'Gás') {
    if (!units.includes('m³')) units.push('m³');
    if (!units.includes('kg')) units.push('kg');
  } else if (fuel.fuel_type === 'Sólido') {
    if (!units.includes('kg')) units.push('kg');
    if (!units.includes('t')) units.push('t');
  }

  return units;
}