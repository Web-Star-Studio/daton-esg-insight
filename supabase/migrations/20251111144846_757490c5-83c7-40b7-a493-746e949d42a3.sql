-- Adicionar campos de percentual de reuso em gri_environmental_data_collection
-- GRI 306-4: Preparation for reuse (2º nível da hierarquia de resíduos)

ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS waste_reuse_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_reuse_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_baseline_reuse_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_reuse_improvement_percent DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_packaging_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_pallets_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_containers_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_equipment_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_construction_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_by_category_other_tonnes DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waste_reuse_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_percentage IS 'Percentual de resíduos reutilizados (%) - 2º nível hierarquia GRI 306-4';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_tonnes IS 'Volume de resíduos reutilizados (toneladas) - sem reprocessamento industrial';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_baseline_reuse_percentage IS 'Percentual de reuso do ano anterior para comparação (%)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_improvement_percent IS 'Melhoria no percentual de reuso vs. ano anterior (pontos percentuais)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_packaging_tonnes IS 'Embalagens retornáveis reutilizadas (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_pallets_tonnes IS 'Pallets reutilizados (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_containers_tonnes IS 'Containers/tambores reutilizados (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_equipment_tonnes IS 'Peças/equipamentos remanufaturados (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_construction_tonnes IS 'Materiais de construção reutilizados (toneladas)';
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_reuse_by_category_other_tonnes IS 'Outros materiais reutilizados (toneladas)';