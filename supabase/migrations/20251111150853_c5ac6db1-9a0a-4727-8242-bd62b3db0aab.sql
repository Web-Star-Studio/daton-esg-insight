-- Adicionar campos para tracking de Percentual de Aterro/Incineração (GRI 306-5)
-- Objetivo: Monitorar e MINIMIZAR disposição final de resíduos

ALTER TABLE public.gri_environmental_data_collection
  -- Percentuais de disposição
  ADD COLUMN IF NOT EXISTS waste_disposal_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_landfill_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_incineration_percentage DECIMAL(10,2),
  
  -- Volumes de disposição (em toneladas)
  ADD COLUMN IF NOT EXISTS waste_disposal_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_landfill_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_incineration_tonnes DECIMAL(15,3),
  
  -- Comparação com baseline
  ADD COLUMN IF NOT EXISTS waste_baseline_disposal_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS waste_disposal_improvement_percent DECIMAL(10,2),
  
  -- Breakdown por perigosidade
  ADD COLUMN IF NOT EXISTS waste_disposal_hazardous_tonnes DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS waste_disposal_non_hazardous_tonnes DECIMAL(15,3),
  
  -- Compliance Zero Waste (meta: ≤10% disposal)
  ADD COLUMN IF NOT EXISTS waste_zero_waste_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS waste_zero_waste_gap_percent DECIMAL(10,2),
  
  -- Impacto ambiental e custos estimados
  ADD COLUMN IF NOT EXISTS waste_disposal_co2_emissions_kg DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS waste_disposal_cost_estimate_brl DECIMAL(15,2),
  
  -- Classificação de desempenho e metadata
  ADD COLUMN IF NOT EXISTS waste_disposal_classification TEXT,
  ADD COLUMN IF NOT EXISTS waste_disposal_calculation_date TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN public.gri_environmental_data_collection.waste_disposal_percentage 
  IS 'Percentual TOTAL de resíduos destinados à disposição final (aterro + incineração) - GRI 306-5. META: ≤10% para certificação Zero Waste.';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_landfill_percentage 
  IS 'Percentual de resíduos enviados para aterro sanitário (6º nível da hierarquia - PIOR). Deve ser minimizado.';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_incineration_percentage 
  IS 'Percentual de resíduos incinerados (5º nível da hierarquia). Deve ser minimizado.';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_zero_waste_compliant 
  IS 'TRUE se disposal ≤10% (elegível para certificação Zero Waste - TRUE, UL 2799)';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_disposal_co2_emissions_kg 
  IS 'Emissões estimadas de CO2 pela disposição (aterro: ~500 kg CO2e/t, incineração: ~700 kg CO2e/t)';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_disposal_cost_estimate_brl 
  IS 'Custo estimado de disposal (aterro: R$150-300/t, incineração: R$400-800/t)';

COMMENT ON COLUMN public.gri_environmental_data_collection.waste_disposal_classification 
  IS 'Classificação de performance: Zero Waste (<10%), Excelente (10-25%), Bom (25-40%), Regular (40-60%), Crítico (>60%)';

-- Índices para performance em queries
CREATE INDEX IF NOT EXISTS idx_gri_env_disposal_percentage 
  ON public.gri_environmental_data_collection(waste_disposal_percentage);

CREATE INDEX IF NOT EXISTS idx_gri_env_zero_waste_compliant 
  ON public.gri_environmental_data_collection(waste_zero_waste_compliant);

CREATE INDEX IF NOT EXISTS idx_gri_env_disposal_classification 
  ON public.gri_environmental_data_collection(waste_disposal_classification);