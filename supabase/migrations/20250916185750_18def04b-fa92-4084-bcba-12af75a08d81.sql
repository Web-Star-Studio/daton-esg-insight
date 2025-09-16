-- Fix emission calculation logic and standardize emission factors to final kg CO2e values

-- 1. Update existing emission factors to have correct final CO2e values (kg CO2e per activity unit)
-- Based on GHG Protocol Brasil 2025.0.1 standards

-- Natural Gas (Combustão Estacionária)
UPDATE public.emission_factors 
SET 
  co2_factor = 2007.0,  -- kg CO2e/1000 m³
  ch4_factor = 0.037,   -- kg CO2e/1000 m³ (already includes GWP)
  n2o_factor = 0.075,   -- kg CO2e/1000 m³ (already includes GWP)
  activity_unit = 'm³',
  source = 'GHG Protocol Brasil 2025.0.1'
WHERE name = 'Gás Natural' 
AND category = 'Combustão Estacionária'
AND type = 'system';

-- Diesel (Combustão Estacionária)
UPDATE public.emission_factors 
SET 
  co2_factor = 2671.0,  -- kg CO2e/1000 litros
  ch4_factor = 0.075,   -- kg CO2e/1000 litros
  n2o_factor = 0.179,   -- kg CO2e/1000 litros
  activity_unit = 'litros',
  source = 'GHG Protocol Brasil 2025.0.1'
WHERE name ILIKE '%diesel%' 
AND category = 'Combustão Estacionária'
AND type = 'system';

-- Gasoline (Combustão Móvel)
UPDATE public.emission_factors 
SET 
  co2_factor = 2271.0,  -- kg CO2e/1000 litros
  ch4_factor = 0.625,   -- kg CO2e/1000 litros
  n2o_factor = 2.384,   -- kg CO2e/1000 litros
  activity_unit = 'litros',
  source = 'GHG Protocol Brasil 2025.0.1'
WHERE name ILIKE '%gasolina%' 
AND category = 'Combustão Móvel'
AND type = 'system';

-- Electricity factors (kWh)
UPDATE public.emission_factors 
SET 
  co2_factor = 0.0805,  -- kg CO2e/kWh (SIN 2023)
  ch4_factor = 0.0,     -- Already included in CO2 factor
  n2o_factor = 0.0,     -- Already included in CO2 factor
  activity_unit = 'kWh',
  source = 'GHG Protocol Brasil 2025.0.1'
WHERE category ILIKE '%eletricidade%'
AND type = 'system';

-- 2. Add a function to calculate simple emissions
CREATE OR REPLACE FUNCTION public.calculate_simple_emissions(
  p_activity_quantity NUMERIC,
  p_activity_unit TEXT,
  p_factor_co2 NUMERIC,
  p_factor_ch4 NUMERIC DEFAULT 0,
  p_factor_n2o NUMERIC DEFAULT 0,
  p_factor_unit TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  conversion_factor NUMERIC := 1.0;
  total_emissions NUMERIC;
  co2_emissions NUMERIC;
  ch4_emissions NUMERIC;
  n2o_emissions NUMERIC;
BEGIN
  -- Apply unit conversion if needed
  IF p_factor_unit IS NOT NULL AND p_activity_unit != p_factor_unit THEN
    SELECT get_conversion_factor(p_activity_unit, p_factor_unit) INTO conversion_factor;
  END IF;
  
  -- Calculate emissions (all factors already in kg CO2e)
  co2_emissions := (p_factor_co2 * p_activity_quantity * conversion_factor);
  ch4_emissions := (p_factor_ch4 * p_activity_quantity * conversion_factor);
  n2o_emissions := (p_factor_n2o * p_activity_quantity * conversion_factor);
  
  total_emissions := co2_emissions + ch4_emissions + n2o_emissions;
  
  -- Convert to tonnes CO2e
  total_emissions := total_emissions / 1000.0;
  
  RETURN jsonb_build_object(
    'total_co2e_tonnes', ROUND(total_emissions, 6),
    'co2_kg', ROUND(co2_emissions, 3),
    'ch4_kg', ROUND(ch4_emissions, 3), 
    'n2o_kg', ROUND(n2o_emissions, 3),
    'conversion_factor_used', conversion_factor,
    'calculation_method', 'simple_direct'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;