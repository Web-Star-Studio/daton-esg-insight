-- Adicionar campos calculados de resíduos em gri_environmental_data_collection
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS waste_by_treatment_recycling_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_by_treatment_landfill_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_by_treatment_incineration_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_by_treatment_composting_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_by_treatment_other_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_baseline_total_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_improvement_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_by_treatment_recycling_tonnes IS 'Resíduos destinados para reciclagem (toneladas) - GRI 306-4';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_by_treatment_landfill_tonnes IS 'Resíduos destinados para aterro (toneladas) - GRI 306-5';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_by_treatment_incineration_tonnes IS 'Resíduos incinerados (toneladas) - GRI 306-5';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_by_treatment_composting_tonnes IS 'Resíduos compostados (toneladas) - GRI 306-4';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_by_treatment_other_tonnes IS 'Resíduos com outros tratamentos (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_baseline_total_tonnes IS 'Total de resíduos do ano anterior para comparação';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_improvement_percent IS 'Percentual de redução vs. ano anterior';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_calculation_date IS 'Data do cálculo automático de resíduos';