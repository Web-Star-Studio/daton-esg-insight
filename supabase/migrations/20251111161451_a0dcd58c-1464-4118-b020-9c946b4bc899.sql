-- Adicionar campos de eficácia de resolução de denúncias
ALTER TABLE public.gri_governance_data_collection
  -- Metas de resolução
  ADD COLUMN IF NOT EXISTS wb_target_resolution_rate DECIMAL(5,2) DEFAULT 85.00,
  ADD COLUMN IF NOT EXISTS wb_is_meeting_target BOOLEAN,
  ADD COLUMN IF NOT EXISTS wb_gap_to_target DECIMAL(10,2),
  
  -- Qualidade de resolução
  ADD COLUMN IF NOT EXISTS wb_resolved_with_action_taken INTEGER,
  ADD COLUMN IF NOT EXISTS wb_resolved_without_action INTEGER,
  ADD COLUMN IF NOT EXISTS wb_resolved_under_30_days_percentage DECIMAL(10,2),
  
  -- Funil de resolução
  ADD COLUMN IF NOT EXISTS wb_resolution_funnel JSONB,
  ADD COLUMN IF NOT EXISTS wb_resolution_speed_score DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wb_backlog_trend TEXT,
  
  -- Categorias best/worst
  ADD COLUMN IF NOT EXISTS wb_best_resolved_categories JSONB,
  ADD COLUMN IF NOT EXISTS wb_worst_resolved_categories JSONB;

COMMENT ON COLUMN public.gri_governance_data_collection.wb_target_resolution_rate 
  IS 'Meta de taxa de resolução definida pela empresa (padrão: 85%)';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_resolution_speed_score 
  IS 'Score de 0-100 baseado na % de denúncias resolvidas em <30 dias';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_backlog_trend 
  IS 'Tendência do backlog: improving, worsening, stable';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_resolved_with_action_taken 
  IS 'Número de denúncias resolvidas com ação corretiva documentada';

COMMENT ON COLUMN public.gri_governance_data_collection.wb_resolution_funnel 
  IS 'Funil de resolução: received, under_investigation, awaiting_action, resolved';