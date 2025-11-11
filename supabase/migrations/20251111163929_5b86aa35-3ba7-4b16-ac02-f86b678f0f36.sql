-- Add Sustainable Revenue fields to gri_economic_data_collection for GRI 201-1, 203-2
ALTER TABLE public.gri_economic_data_collection
  -- Receita Sustentável Agregada
  ADD COLUMN IF NOT EXISTS sustainable_revenue_total NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sustainable_revenue_percentage NUMERIC(10,4),
  
  -- Breakdown por Categoria ESG
  ADD COLUMN IF NOT EXISTS revenue_clean_energy NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS revenue_recycled_products NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS revenue_circular_economy NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS revenue_social_programs NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS revenue_sustainable_services NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS revenue_other_esg NUMERIC(15,2),
  
  -- Breakdown detalhado (JSONB para flexibilidade)
  ADD COLUMN IF NOT EXISTS sustainable_revenue_breakdown JSONB,
  
  -- Crescimento e Comparações
  ADD COLUMN IF NOT EXISTS previous_period_sustainable_revenue NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS sustainable_revenue_growth_percentage NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_sustainable_revenue_increasing BOOLEAN,
  
  -- Benchmarks Setoriais
  ADD COLUMN IF NOT EXISTS sector_avg_sustainable_revenue_percentage NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS is_above_sector_avg_sustainable_revenue BOOLEAN,
  
  -- ROI e Impacto
  ADD COLUMN IF NOT EXISTS sustainable_revenue_roi NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS environmental_impact_from_revenue JSONB,
  ADD COLUMN IF NOT EXISTS social_impact_from_revenue JSONB,
  
  -- Compliance
  ADD COLUMN IF NOT EXISTS gri_203_2_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS sustainable_revenue_missing_data JSONB,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS sustainable_revenue_calculation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sustainable_revenue_data_source TEXT;

COMMENT ON COLUMN public.gri_economic_data_collection.sustainable_revenue_total 
  IS 'GRI 201-1, 203-2: Receita total de produtos/serviços com benefícios ambientais ou sociais';

COMMENT ON COLUMN public.gri_economic_data_collection.sustainable_revenue_percentage 
  IS '% da receita total proveniente de produtos/serviços sustentáveis: (Receita ESG / Receita Total) × 100';

COMMENT ON COLUMN public.gri_economic_data_collection.sustainable_revenue_roi 
  IS 'Retorno sobre Investimento ESG: (Receita ESG - Investimento ESG) / Investimento ESG × 100';