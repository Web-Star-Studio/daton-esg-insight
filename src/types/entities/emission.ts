/**
 * Emission entity types
 * 
 * Note: EmissionFactorDetails uses Json type for Supabase compatibility
 */

import type { Json } from "@/integrations/supabase/types";

/**
 * Type-safe emission factor details structure
 * Use this for type inference when working with emission factor details
 */
export interface EmissionFactorDetailsShape {
  biogenic_fraction?: number;
  density?: number;
  calorific_value?: number;
  vehicle_category?: string;
  model_year?: number;
  fuel_mix?: string;
  grid_type?: string;
  emission_scope?: string;
  methodology?: string;
  [key: string]: number | string | boolean | undefined;
}

export interface VehicleFactorDetails {
  vehicle_category: string;
  model_year: number;
  fuel_mix: string;
  [key: string]: string | number;
}

export interface ElectricityFactorDetails {
  grid_type: string;
  emission_scope: string;
  methodology: string;
  [key: string]: string;
}

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  activity_unit: string;
  co2_factor: number | null;
  ch4_factor: number | null;
  n2o_factor: number | null;
  source: string;
  year_of_validity: number | null;
  type: 'system' | 'custom';
  company_id: string | null;
  created_at: string;
  validation_status?: string;
  details_json?: Json;
  fuel_type?: string;
  density?: number;
  calorific_value?: number;
  biogenic_fraction?: number;
}

export interface CreateEmissionFactorData {
  name: string;
  category: string;
  activity_unit: string;
  co2_factor?: number;
  ch4_factor?: number;
  n2o_factor?: number;
  source: string;
  year_of_validity?: number;
  details_json?: Json;
}

export interface CalculatedEmission {
  id: string;
  activity_data_id: string;
  emission_factor_id: string;
  co2_emissions: number;
  ch4_emissions: number;
  n2o_emissions: number;
  total_co2e: number;
  calculation_date: string;
  calculation_method: string;
}
