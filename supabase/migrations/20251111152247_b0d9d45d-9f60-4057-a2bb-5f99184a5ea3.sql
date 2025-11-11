-- Adicionar campos de LTIFR em gri_social_data_collection
ALTER TABLE public.gri_social_data_collection
  ADD COLUMN IF NOT EXISTS ltifr_value DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS ltifr_worked_hours DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS ltifr_accidents_with_lost_time INTEGER,
  ADD COLUMN IF NOT EXISTS ltifr_calculation_method TEXT CHECK (ltifr_calculation_method IN ('real_data', 'estimated_by_employees', 'estimated_default')),
  ADD COLUMN IF NOT EXISTS ltifr_data_quality TEXT CHECK (ltifr_data_quality IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS ltifr_confidence_level INTEGER CHECK (ltifr_confidence_level >= 0 AND ltifr_confidence_level <= 100),
  ADD COLUMN IF NOT EXISTS ltifr_calculation_date TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.gri_social_data_collection.ltifr_value 
  IS 'Taxa de Frequência de Acidentes - LTIFR (OIT/ISO 45001): (Nº Acidentes com Afastamento × 1.000.000) / Total Horas Trabalhadas';

COMMENT ON COLUMN public.gri_social_data_collection.ltifr_calculation_method 
  IS 'Método de cálculo: real_data (attendance_records), estimated_by_employees (funcionários ativos), ou estimated_default (padrão 200k)';

COMMENT ON COLUMN public.gri_social_data_collection.ltifr_data_quality 
  IS 'Qualidade do dado: high (dados reais), medium (estimativa por funcionários), low (padrão)';

COMMENT ON COLUMN public.gri_social_data_collection.ltifr_confidence_level 
  IS 'Nível de confiança do cálculo (0-100%): high=95%, medium=70%, low=50%';