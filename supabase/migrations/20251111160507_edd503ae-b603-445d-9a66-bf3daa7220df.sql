-- Add whistleblower analysis fields to gri_governance_data_collection
ALTER TABLE public.gri_governance_data_collection
  -- Totais e percentuais gerais
  ADD COLUMN IF NOT EXISTS wb_total_reports INTEGER,
  ADD COLUMN IF NOT EXISTS wb_total_reports_current_year INTEGER,
  ADD COLUMN IF NOT EXISTS wb_open_reports INTEGER,
  ADD COLUMN IF NOT EXISTS wb_closed_reports INTEGER,
  ADD COLUMN IF NOT EXISTS wb_anonymous_reports INTEGER,
  ADD COLUMN IF NOT EXISTS wb_anonymous_percentage DECIMAL(10,2),
  
  -- Breakdown (JSONB)
  ADD COLUMN IF NOT EXISTS wb_by_status JSONB,
  ADD COLUMN IF NOT EXISTS wb_by_category JSONB,
  ADD COLUMN IF NOT EXISTS wb_by_priority JSONB,
  
  -- Tendência mensal
  ADD COLUMN IF NOT EXISTS wb_monthly_trend JSONB,
  
  -- Métricas de resolução
  ADD COLUMN IF NOT EXISTS wb_resolution_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_avg_resolution_time_days DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_median_resolution_time_days DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_reports_overdue INTEGER,
  ADD COLUMN IF NOT EXISTS wb_reports_under_30_days INTEGER,
  ADD COLUMN IF NOT EXISTS wb_reports_30_90_days INTEGER,
  ADD COLUMN IF NOT EXISTS wb_reports_over_90_days INTEGER,
  
  -- Comparação com período anterior
  ADD COLUMN IF NOT EXISTS wb_previous_period_total INTEGER,
  ADD COLUMN IF NOT EXISTS wb_change_percentage DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_previous_resolution_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_resolution_rate_change DECIMAL(10,2),
  
  -- Top categorias
  ADD COLUMN IF NOT EXISTS wb_top_5_categories JSONB,
  
  -- Análise de reincidência
  ADD COLUMN IF NOT EXISTS wb_systemic_issues JSONB,
  ADD COLUMN IF NOT EXISTS wb_systemic_issues_count INTEGER,
  
  -- Classificação e compliance
  ADD COLUMN IF NOT EXISTS wb_performance_classification TEXT,
  ADD COLUMN IF NOT EXISTS wb_gri_2_26_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS wb_iso_37001_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS wb_compliance_missing_data JSONB,
  
  -- Benchmarks
  ADD COLUMN IF NOT EXISTS wb_channel_utilization_rate DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS wb_sector_benchmark_reports_per_100 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_sector_benchmark_resolution_days DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_sector_benchmark_resolution_rate DECIMAL(10,2),
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS wb_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_governance_data_collection.wb_total_reports 
  IS 'GRI 2-26: Total de denúncias recebidas no período via canal de ética';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_resolution_rate 
  IS 'Percentual de denúncias resolvidas: (Fechadas / Total) × 100';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_avg_resolution_time_days 
  IS 'Tempo médio em dias para resolução de denúncias (da abertura ao fechamento)';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_systemic_issues 
  IS 'Categorias com ≥3 denúncias em 6 meses (indicam problemas sistêmicos)';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_gri_2_26_compliant 
  IS 'GRI 2-26: Mecanismos de comunicação de preocupações sobre práticas não éticas';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_iso_37001_compliant 
  IS 'ISO 37001: Sistema de Gestão Antissuborno - Procedimentos de denúncia e investigação';