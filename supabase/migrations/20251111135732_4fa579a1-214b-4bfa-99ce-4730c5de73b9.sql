-- Adicionar campos de percentual de água reutilizada
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS water_reuse_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS water_reuse_volume_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_baseline_reuse_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS water_reuse_improvement_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS water_reuse_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_environmental_data_collection.water_reuse_percentage IS 'Percentual de água reutilizada sobre consumo total (%)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_reuse_volume_m3 IS 'Volume de água reutilizada (m³)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_baseline_reuse_percentage IS 'Percentual de reuso do ano anterior para comparação (%)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_reuse_improvement_percent IS 'Melhoria no percentual de reuso vs. ano anterior (pontos percentuais)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_reuse_calculation_date IS 'Data do cálculo do percentual de reuso';