-- Adicionar campos de análise de horas de treinamento em gri_social_data_collection
ALTER TABLE public.gri_social_data_collection
  -- Totais e média
  ADD COLUMN IF NOT EXISTS training_avg_hours_per_employee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS training_total_hours_period DECIMAL(15,2),
  
  -- Qualidade de dados
  ADD COLUMN IF NOT EXISTS training_data_quality TEXT,
  ADD COLUMN IF NOT EXISTS training_data_completeness_percent DECIMAL(5,2),
  
  -- Breakdown (JSONB para estrutura flexível)
  ADD COLUMN IF NOT EXISTS training_hours_by_gender JSONB,
  ADD COLUMN IF NOT EXISTS training_hours_by_department JSONB,
  ADD COLUMN IF NOT EXISTS training_hours_by_category JSONB,
  ADD COLUMN IF NOT EXISTS training_hours_by_role JSONB,
  
  -- Obrigatórios vs Opcionais
  ADD COLUMN IF NOT EXISTS training_mandatory_vs_optional JSONB,
  
  -- Tendência mensal
  ADD COLUMN IF NOT EXISTS training_monthly_trend JSONB,
  
  -- Comparação
  ADD COLUMN IF NOT EXISTS training_previous_period_avg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS training_change_percent DECIMAL(10,2),
  
  -- Gaps
  ADD COLUMN IF NOT EXISTS training_employees_without_training INTEGER,
  ADD COLUMN IF NOT EXISTS training_employees_without_training_percent DECIMAL(5,2),
  
  -- Top/Bottom performers
  ADD COLUMN IF NOT EXISTS training_top_10_employees JSONB,
  ADD COLUMN IF NOT EXISTS training_bottom_10_employees JSONB,
  
  -- Classificação e benchmark
  ADD COLUMN IF NOT EXISTS training_performance_classification TEXT,
  ADD COLUMN IF NOT EXISTS training_sector_benchmark DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS training_performance_vs_benchmark DECIMAL(10,2),
  
  -- GRI Compliance
  ADD COLUMN IF NOT EXISTS training_gri_404_1_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS training_gri_missing_data JSONB,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS training_calculation_date TIMESTAMPTZ;

-- Comentários explicativos
COMMENT ON COLUMN public.gri_social_data_collection.training_avg_hours_per_employee 
  IS 'GRI 404-1: Média de horas de treinamento por funcionário/ano. Fórmula: Total Horas / Nº Colaboradores';

COMMENT ON COLUMN public.gri_social_data_collection.training_data_quality 
  IS 'Qualidade do dado: high (≥90% com duração), medium (70-89%), low (<70%)';

COMMENT ON COLUMN public.gri_social_data_collection.training_sector_benchmark 
  IS 'Benchmark setorial de horas de treinamento/funcionário/ano (padrão: 40h)';

COMMENT ON COLUMN public.gri_social_data_collection.training_hours_by_gender 
  IS 'Breakdown de horas de treinamento por gênero (men, women, other) - GRI 404-1';

COMMENT ON COLUMN public.gri_social_data_collection.training_hours_by_department 
  IS 'Breakdown de horas de treinamento por departamento com média e % do total';

COMMENT ON COLUMN public.gri_social_data_collection.training_hours_by_category 
  IS 'Breakdown de horas de treinamento por categoria (ESG, Técnico, NR, etc)';

COMMENT ON COLUMN public.gri_social_data_collection.training_mandatory_vs_optional 
  IS 'Distribuição de horas entre treinamentos obrigatórios e opcionais';

COMMENT ON COLUMN public.gri_social_data_collection.training_monthly_trend 
  IS 'Tendência mensal de horas de treinamento (últimos 12 meses)';

COMMENT ON COLUMN public.gri_social_data_collection.training_employees_without_training 
  IS 'Número de funcionários ativos que não receberam treinamento no período';

COMMENT ON COLUMN public.gri_social_data_collection.training_top_10_employees 
  IS 'Top 10 funcionários por horas de treinamento (reconhecimento)';

COMMENT ON COLUMN public.gri_social_data_collection.training_performance_classification 
  IS 'Classificação: Excelente (≥1.2x benchmark), Bom (≥1x), Atenção (≥0.6x), Crítico (<0.6x)';

COMMENT ON COLUMN public.gri_social_data_collection.training_gri_404_1_compliant 
  IS 'Se os dados atendem todos os requisitos GRI 404-1 (breakdown por gênero, categoria, etc)';
