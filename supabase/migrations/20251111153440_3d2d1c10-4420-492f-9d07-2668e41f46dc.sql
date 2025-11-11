-- Adicionar campos para análise de Acidentes com Afastamento (GRI 403-9)
-- Tabela: gri_social_data_collection

ALTER TABLE public.gri_social_data_collection
  -- Total e taxa
  ADD COLUMN IF NOT EXISTS accidents_with_lost_time INTEGER,
  ADD COLUMN IF NOT EXISTS lost_time_accident_rate DECIMAL(10,2),
  
  -- Breakdown (JSONB para estrutura flexível)
  ADD COLUMN IF NOT EXISTS accidents_by_incident_type JSONB,
  ADD COLUMN IF NOT EXISTS accidents_by_severity JSONB,
  ADD COLUMN IF NOT EXISTS accidents_monthly_trend JSONB,
  
  -- Comparação
  ADD COLUMN IF NOT EXISTS previous_period_lost_time_accidents INTEGER,
  ADD COLUMN IF NOT EXISTS lost_time_accidents_change_percent DECIMAL(10,2),
  
  -- Top tipos
  ADD COLUMN IF NOT EXISTS top_lost_time_accident_types JSONB,
  
  -- Classificação
  ADD COLUMN IF NOT EXISTS lost_time_accidents_classification TEXT,
  ADD COLUMN IF NOT EXISTS lost_time_accidents_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_social_data_collection.accidents_with_lost_time 
  IS 'Número de acidentes que resultaram em afastamento (days_lost > 0) - GRI 403-9';

COMMENT ON COLUMN public.gri_social_data_collection.lost_time_accident_rate 
  IS 'Percentual de acidentes que causam afastamento: (Acidentes com Afastamento / Total Acidentes) × 100';

COMMENT ON COLUMN public.gri_social_data_collection.accidents_by_incident_type 
  IS 'Distribuição de acidentes com afastamento por tipo de incidente (JSONB)';

COMMENT ON COLUMN public.gri_social_data_collection.accidents_by_severity 
  IS 'Distribuição de acidentes com afastamento por severidade (JSONB)';

COMMENT ON COLUMN public.gri_social_data_collection.accidents_monthly_trend 
  IS 'Tendência mensal de acidentes com afastamento (últimos 12 meses, JSONB)';

COMMENT ON COLUMN public.gri_social_data_collection.top_lost_time_accident_types 
  IS 'Top 5 tipos de acidentes que mais causam afastamento (JSONB)';

COMMENT ON COLUMN public.gri_social_data_collection.lost_time_accidents_classification 
  IS 'Classificação de desempenho: Excelente/Bom/Atenção/Crítico';

COMMENT ON COLUMN public.gri_social_data_collection.lost_time_accidents_calculation_date 
  IS 'Data do último cálculo de acidentes com afastamento';