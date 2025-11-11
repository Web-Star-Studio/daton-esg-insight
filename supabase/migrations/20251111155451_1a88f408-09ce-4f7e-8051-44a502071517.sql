-- FASE 1: Adicionar campos PCD na tabela employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_pcd BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pcd_type TEXT,
  ADD COLUMN IF NOT EXISTS pcd_cid TEXT;

COMMENT ON COLUMN public.employees.is_pcd 
  IS 'Indica se o funcionário é Pessoa com Deficiência (PCD) - Lei 8.213/91';

COMMENT ON COLUMN public.employees.pcd_type 
  IS 'Tipo de deficiência: Física, Auditiva, Visual, Intelectual, Múltipla';

COMMENT ON COLUMN public.employees.pcd_cid 
  IS 'Código CID-10 da deficiência (opcional, para compliance)';

-- FASE 4: Adicionar campos de diversidade em gri_social_data_collection
ALTER TABLE public.gri_social_data_collection
  -- Totais gerais
  ADD COLUMN IF NOT EXISTS diversity_total_women INTEGER,
  ADD COLUMN IF NOT EXISTS diversity_total_pcd INTEGER,
  ADD COLUMN IF NOT EXISTS diversity_total_minorities INTEGER,
  ADD COLUMN IF NOT EXISTS diversity_women_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_pcd_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_minorities_percentage DECIMAL(10,2),
  
  -- Breakdown por nível hierárquico (JSONB)
  ADD COLUMN IF NOT EXISTS diversity_by_hierarchy_level JSONB,
  
  -- Análise de pipeline
  ADD COLUMN IF NOT EXISTS diversity_leadership_gap DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_gender_gap_top_vs_base DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_pcd_gap_top_vs_base DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_pipeline_funnel JSONB,
  
  -- Equidade salarial (GRI 405-2)
  ADD COLUMN IF NOT EXISTS diversity_avg_salary_women DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS diversity_avg_salary_men DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS diversity_pay_gap_percentage DECIMAL(10,2),
  
  -- Comparação com período anterior
  ADD COLUMN IF NOT EXISTS diversity_previous_women_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_change_women_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_previous_pcd_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diversity_change_pcd_percentage DECIMAL(10,2),
  
  -- Top/Bottom departamentos
  ADD COLUMN IF NOT EXISTS diversity_top_5_departments JSONB,
  ADD COLUMN IF NOT EXISTS diversity_bottom_5_departments JSONB,
  
  -- Classificação e compliance
  ADD COLUMN IF NOT EXISTS diversity_performance_classification TEXT,
  ADD COLUMN IF NOT EXISTS diversity_gri_405_1_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS diversity_gri_missing_data JSONB,
  
  -- Lei de Cotas (Brasil)
  ADD COLUMN IF NOT EXISTS diversity_quota_law_required_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS diversity_quota_law_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS diversity_quota_missing_pcd_hires INTEGER,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS diversity_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_social_data_collection.diversity_by_hierarchy_level 
  IS 'GRI 405-1: Breakdown de diversidade (gênero, etnia, PCD) por nível hierárquico (C-Level, Diretoria, Gerência, etc.)';

COMMENT ON COLUMN public.gri_social_data_collection.diversity_leadership_gap 
  IS 'Diferença percentual de diversidade entre C-Level e base operacional';

COMMENT ON COLUMN public.gri_social_data_collection.diversity_pay_gap_percentage 
  IS 'GRI 405-2: Gap salarial entre homens e mulheres (%). Fórmula: (Salário Homens - Salário Mulheres) / Salário Homens × 100';

COMMENT ON COLUMN public.gri_social_data_collection.diversity_quota_law_compliant 
  IS 'Compliance com Lei 8.213/91 (Lei de Cotas de PCD - Brasil)';