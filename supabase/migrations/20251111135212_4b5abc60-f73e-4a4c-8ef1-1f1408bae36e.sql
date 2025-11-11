-- Adicionar campos de intensidade hídrica em gri_environmental_data_collection
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS water_intensity_m3_per_unit DECIMAL(15,6),
  ADD COLUMN IF NOT EXISTS water_intensity_unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS water_intensity_m3_per_revenue DECIMAL(15,6),
  ADD COLUMN IF NOT EXISTS water_intensity_baseline DECIMAL(15,6),
  ADD COLUMN IF NOT EXISTS water_intensity_improvement_percent DECIMAL(10,2);

COMMENT ON COLUMN public.gri_environmental_data_collection.water_intensity_m3_per_unit IS 'Intensidade hídrica por unidade produzida (m³/unidade) - GRI 303-5';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_intensity_unit IS 'Unidade de medida da intensidade hídrica (ex: m³/tonelada)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_intensity_m3_per_revenue IS 'Intensidade hídrica por receita (m³/R$ 1.000)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_intensity_baseline IS 'Intensidade hídrica do ano base para comparação';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_intensity_improvement_percent IS 'Percentual de melhoria na intensidade hídrica';