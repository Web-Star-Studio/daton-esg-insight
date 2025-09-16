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
    name: "Acetileno",
    fuel_type: "Gás",
    calorific_value: 48.2,
    calorific_value_unit: "TJ/Gg",
    density: 1.17,
    density_unit: "kg/m³",
    co2_factor: 65.2,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Alcatrão",
    fuel_type: "Líquido",
    calorific_value: 28.0,
    calorific_value_unit: "TJ/Gg",
    density: 1.20,
    density_unit: "kg/L",
    co2_factor: 80.7,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Asfaltos",
    fuel_type: "Líquido",
    calorific_value: 40.2,
    calorific_value_unit: "TJ/Gg",
    density: 1.0,
    density_unit: "t/m³",
    co2_factor: 80.7,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Metalúrgico Importado",
    fuel_type: "Sólido",
    calorific_value: 28.2,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 94.6,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Metalúrgico Nacional",
    fuel_type: "Sólido",
    calorific_value: 28.2,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 94.6,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 3100 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 13.0,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 3300 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 13.8,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 3700 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 15.5,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 4200 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 17.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 4500 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 18.8,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 4700 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 19.7,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 5200 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 21.8,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 5900 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 24.7,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor 6000 kcal / kg",
    fuel_type: "Sólido",
    calorific_value: 25.1,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Carvão Vapor sem Especificação",
    fuel_type: "Sólido",
    calorific_value: 18.9,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 96.1,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
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
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Coque de Petróleo",
    fuel_type: "Sólido",
    calorific_value: 31.0,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 97.5,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Etano",
    fuel_type: "Gás",
    calorific_value: 47.8,
    calorific_value_unit: "TJ/Gg",
    density: 1.36,
    density_unit: "kg/m³",
    co2_factor: 61.6,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gás de Coqueria",
    fuel_type: "Gás",
    calorific_value: 38.7,
    calorific_value_unit: "TJ/Gg",
    density: 0.45,
    density_unit: "kg/m³",
    co2_factor: 44.4,
    ch4_factor: 5,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gás de Refinaria",
    fuel_type: "Gás",
    calorific_value: 49.5,
    calorific_value_unit: "TJ/Gg",
    density: 0.64,
    density_unit: "kg/m³",
    co2_factor: 57.6,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gás Liquefeito de Petróleo (GLP)",
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gás Natural Seco",
    fuel_type: "Gás",
    calorific_value: 48.0,
    calorific_value_unit: "TJ/Gg",
    density: 0.75,
    density_unit: "kg/m³",
    co2_factor: 56.1,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gás Natural Úmido",
    fuel_type: "Gás",
    calorific_value: 38.3,
    calorific_value_unit: "TJ/Gg",
    density: 0.85,
    density_unit: "kg/m³",
    co2_factor: 54.9,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gasolina Automotiva (pura)",
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Gasolina de Aviação",
    fuel_type: "Líquido",
    calorific_value: 44.3,
    calorific_value_unit: "TJ/Gg",
    density: 0.72,
    density_unit: "kg/L",
    co2_factor: 70.0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Líquidos de Gás Natural (LGN)",
    fuel_type: "Líquido",
    calorific_value: 44.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.54,
    density_unit: "kg/L",
    co2_factor: 64.2,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Lubrificantes",
    fuel_type: "Líquido",
    calorific_value: 40.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.90,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Nafta",
    fuel_type: "Líquido",
    calorific_value: 44.5,
    calorific_value_unit: "TJ/Gg",
    density: 0.68,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo Combustível",
    fuel_type: "Líquido",
    calorific_value: 40.4,
    calorific_value_unit: "TJ/Gg",
    density: 0.99,
    density_unit: "kg/L",
    co2_factor: 77.4,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo de Xisto",
    fuel_type: "Líquido",
    calorific_value: 38.1,
    calorific_value_unit: "TJ/Gg",
    density: 0.91,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleo Diesel (puro)",
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Óleos Residuais",
    fuel_type: "Líquido",
    calorific_value: 40.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.95,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Outros Produtos de Petróleo",
    fuel_type: "Líquido",
    calorific_value: 40.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.90,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Parafina",
    fuel_type: "Sólido",
    calorific_value: 46.0,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Petróleo Bruto",
    fuel_type: "Líquido",
    calorific_value: 42.3,
    calorific_value_unit: "TJ/Gg",
    density: 0.88,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Querosene de Aviação",
    fuel_type: "Líquido",
    calorific_value: 43.8,
    calorific_value_unit: "TJ/Gg",
    density: 0.81,
    density_unit: "kg/L",
    co2_factor: 71.5,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Querosene Iluminante",
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
    economic_sectors: ["Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Resíduos Industriais",
    fuel_type: "Sólido",
    calorific_value: 17.0,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 143.0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Resíduos Municipais (fração não-biomassa)",
    fuel_type: "Sólido",
    calorific_value: 10.0,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 91.7,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Solventes",
    fuel_type: "Líquido",
    calorific_value: 40.2,
    calorific_value_unit: "TJ/Gg",
    density: 0.80,
    density_unit: "kg/L",
    co2_factor: 73.3,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Turfa",
    fuel_type: "Sólido",
    calorific_value: 9.76,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 106.0,
    ch4_factor: 1,
    n2o_factor: 1.5,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Xisto Betuminoso e Areias Betuminosas",
    fuel_type: "Líquido",
    calorific_value: 31.8,
    calorific_value_unit: "TJ/Gg",
    density: 0.95,
    density_unit: "kg/L",
    co2_factor: 107.0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: false,
    biogenic_fraction: 0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },

  // BIOCOMBUSTÍVEIS
  {
    name: "Etanol Anidro",
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Etanol Hidratado",
    fuel_type: "Líquido",
    calorific_value: 24.5,
    calorific_value_unit: "TJ/Gg",
    density: 0.81,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Bagaço de Cana",
    fuel_type: "Sólido",
    calorific_value: 9.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Biodiesel (B100)",
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Biogás (outros)",
    fuel_type: "Gás",
    calorific_value: 50.4,
    calorific_value_unit: "TJ/Gg",
    density: 1.2,
    density_unit: "kg/m³",
    co2_factor: 0,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Biogás de aterro",
    fuel_type: "Gás",
    calorific_value: 50.4,
    calorific_value_unit: "TJ/Gg",
    density: 1.2,
    density_unit: "kg/m³",
    co2_factor: 0,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "m³",
    economic_sectors: ["Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Biometano",
    fuel_type: "Gás",
    calorific_value: 50.4,
    calorific_value_unit: "TJ/Gg",
    density: 0.72,
    density_unit: "kg/m³",
    co2_factor: 0,
    ch4_factor: 1,
    n2o_factor: 0.1,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "m³",
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Caldo de Cana",
    fuel_type: "Líquido",
    calorific_value: 5.4,
    calorific_value_unit: "TJ/Gg",
    density: 1.06,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção", "Residencial, Agricultura, Florestal ou Pesca"],
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
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Lenha Comercial",
    fuel_type: "Sólido",
    calorific_value: 15.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 300,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção", "Comercial e Institucional", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Licor Negro (Lixívia)",
    fuel_type: "Líquido",
    calorific_value: 13.2,
    calorific_value_unit: "TJ/Gg",
    density: 1.3,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Melaço",
    fuel_type: "Líquido",
    calorific_value: 13.0,
    calorific_value_unit: "TJ/Gg",
    density: 1.4,
    density_unit: "kg/L",
    co2_factor: 0,
    ch4_factor: 3,
    n2o_factor: 0.6,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "L",
    economic_sectors: ["Energia", "Manufatura e construção", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Resíduos Municipais (fração biomassa)",
    fuel_type: "Sólido",
    calorific_value: 6.5,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Energia"],
    source: "GHG Protocol Brasil 2025.0.1"
  },
  {
    name: "Resíduos Vegetais",
    fuel_type: "Sólido",
    calorific_value: 15.6,
    calorific_value_unit: "TJ/Gg",
    co2_factor: 0,
    ch4_factor: 30,
    n2o_factor: 4,
    is_biofuel: true,
    biogenic_fraction: 1.0,
    activity_unit: "kg",
    economic_sectors: ["Energia", "Manufatura e construção", "Residencial, Agricultura, Florestal ou Pesca"],
    source: "GHG Protocol Brasil 2025.0.1"
  }
];

// Economic sectors available
export const ECONOMIC_SECTORS = [
  "Energia",
  "Manufatura e construção",
  "Comercial e Institucional",
  "Residencial, Agricultura, Florestal ou Pesca"
] as const;

export type EconomicSector = typeof ECONOMIC_SECTORS[number];

// Get fuels by economic sector
export function getFuelsByEconomicSector(sector: EconomicSector): Omit<StationaryFuel, 'id'>[] {
  return STATIONARY_FUELS.filter(fuel => fuel.economic_sectors.includes(sector));
}

// Get fuel by name with flexible matching
export function getFuelByName(name: string): Omit<StationaryFuel, 'id'> | undefined {
  // Try exact match first
  let fuel = STATIONARY_FUELS.find(fuel => fuel.name === name);
  
  if (!fuel) {
    // Try case insensitive match
    fuel = STATIONARY_FUELS.find(fuel => 
      fuel.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  if (!fuel) {
    // Try partial match for common variations
    const normalizedName = name.toLowerCase().replace(/[()]/g, '').trim();
    fuel = STATIONARY_FUELS.find(fuel => {
      const normalizedFuelName = fuel.name.toLowerCase().replace(/[()]/g, '').trim();
      return normalizedFuelName.includes(normalizedName) || 
             normalizedName.includes(normalizedFuelName);
    });
  }
  
  return fuel;
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
  
  console.log('Calculating stationary combustion for fuel:', fuelName);
  
  const fuel = getFuelByName(fuelName);
  if (!fuel) {
    console.error('Available fuels:', STATIONARY_FUELS.map(f => f.name));
    throw new Error(`Combustível não encontrado: ${fuelName}. Verifique se o combustível está na lista de combustão estacionária.`);
  }

  console.log('Found fuel:', fuel.name);

      // Validate economic sector compatibility
      if (!fuel.economic_sectors.includes(economicSector)) {
        console.warn(`Fuel ${fuelName} not compatible with sector ${economicSector}, using Energia as fallback`);
        // Use Energia as fallback for compatibility
        economicSector = 'Energia';
      }

  // Convert quantity to mass (kg) if needed
  let massKg = quantity;
  
  if (activityUnit !== 'kg') {
    // Convert using density or conversion factors
    if (activityUnit === 'L' && fuel.density) {
      massKg = quantity * fuel.density;
    } else if (activityUnit === 'm³') {
      if (fuel.density) {
        // Handle different density units
        if (fuel.density_unit === 't/m³') {
          massKg = quantity * fuel.density * 1000; // Convert tonnes to kg
        } else if (fuel.density_unit === 'kg/L') {
          massKg = quantity * fuel.density * 1000; // m³ to L then to kg
        } else {
          massKg = quantity * fuel.density * 1000; // Default conversion
        }
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
      // Check if factor already exists
      const { data: existingFactor } = await supabase
        .from('emission_factors')
        .select('id')
        .eq('name', fuel.name)
        .eq('category', 'Combustão Estacionária')
        .eq('source', fuel.source)
        .eq('type', 'system')
        .single();

      let error;
      if (existingFactor) {
        // Update existing factor
        const updateResult = await supabase
          .from('emission_factors')
          .update({
            activity_unit: fuel.activity_unit,
            co2_factor: fuel.co2_factor,
            ch4_factor: fuel.ch4_factor,
            n2o_factor: fuel.n2o_factor,
            year_of_validity: 2025,
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
          })
          .eq('id', existingFactor.id);
        error = updateResult.error;
      } else {
        // Insert new factor
        const insertResult = await supabase
          .from('emission_factors')
          .insert({
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
          });
        error = insertResult.error;
      }

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