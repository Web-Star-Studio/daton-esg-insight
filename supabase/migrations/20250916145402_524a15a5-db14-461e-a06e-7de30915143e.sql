-- Add economic sector to emission sources for GHG Protocol compliance
ALTER TABLE public.emission_sources 
ADD COLUMN economic_sector TEXT CHECK (economic_sector IN (
  'Comercial/Institucional',
  'Industrial', 
  'Agropecuário',
  'Residencial',
  'Geração de Energia'
));

-- Add fossil and biogenic CO2e separation to calculated emissions
ALTER TABLE public.calculated_emissions 
ADD COLUMN fossil_co2e NUMERIC DEFAULT 0,
ADD COLUMN biogenic_co2e NUMERIC DEFAULT 0;

-- Add fuel properties to emission factors for better classification
ALTER TABLE public.emission_factors 
ADD COLUMN fuel_type TEXT,
ADD COLUMN is_biofuel BOOLEAN DEFAULT FALSE,
ADD COLUMN calorific_value NUMERIC,
ADD COLUMN calorific_value_unit TEXT DEFAULT 'TJ/Gg',
ADD COLUMN density NUMERIC,
ADD COLUMN density_unit TEXT,
ADD COLUMN biogenic_fraction NUMERIC DEFAULT 0 CHECK (biogenic_fraction >= 0 AND biogenic_fraction <= 1);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_emission_factors_fuel_type ON public.emission_factors(fuel_type);
CREATE INDEX IF NOT EXISTS idx_emission_sources_economic_sector ON public.emission_sources(economic_sector);