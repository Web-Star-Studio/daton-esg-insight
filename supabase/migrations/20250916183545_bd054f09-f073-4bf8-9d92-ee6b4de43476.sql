-- Adicionar campos necessários para os novos fatores GHG Protocol Brasil 2025

-- Adicionar colunas se não existirem
ALTER TABLE public.emission_factors 
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS density NUMERIC,
ADD COLUMN IF NOT EXISTS calorific_value NUMERIC,
ADD COLUMN IF NOT EXISTS calorific_value_unit TEXT DEFAULT 'TJ/Gg',
ADD COLUMN IF NOT EXISTS density_unit TEXT,
ADD COLUMN IF NOT EXISTS biogenic_fraction NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_biofuel BOOLEAN DEFAULT FALSE;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.emission_factors.fuel_type IS 'Tipo do combustível: Líquido, Gasoso, Sólido';
COMMENT ON COLUMN public.emission_factors.density IS 'Densidade do combustível';
COMMENT ON COLUMN public.emission_factors.calorific_value IS 'Poder calorífico inferior do combustível';
COMMENT ON COLUMN public.emission_factors.biogenic_fraction IS 'Fração biogênica (0-1) para combustíveis renováveis';
COMMENT ON COLUMN public.emission_factors.is_biofuel IS 'Indica se é um biocombustível';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_emission_factors_fuel_type ON public.emission_factors(fuel_type);
CREATE INDEX IF NOT EXISTS idx_emission_factors_year_validity ON public.emission_factors(year_of_validity);
CREATE INDEX IF NOT EXISTS idx_emission_factors_category_year ON public.emission_factors(category, year_of_validity);

-- Atualizar alguns fatores existentes para marcar como biocombustíveis
UPDATE public.emission_factors 
SET is_biofuel = TRUE, biogenic_fraction = 1.0
WHERE name ILIKE '%etanol%' OR name ILIKE '%biodiesel%' OR name ILIKE '%lenha%' OR name ILIKE '%carvão vegetal%';