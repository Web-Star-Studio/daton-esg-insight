-- Adicionar campos de relacionamento e gerenciamento em license_conditions
ALTER TABLE public.license_conditions 
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS attachment_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_alert_id UUID REFERENCES public.license_alerts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_observation_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS compliance_impact TEXT CHECK (compliance_impact IN ('crítico', 'alto', 'médio', 'baixo')),
ADD COLUMN IF NOT EXISTS notification_days_before INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_notification_sent TIMESTAMPTZ;

-- Adicionar relacionamentos bidirecionais em license_alerts
ALTER TABLE public.license_alerts 
ADD COLUMN IF NOT EXISTS source_condition_id UUID REFERENCES public.license_conditions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_observation_id UUID REFERENCES public.license_observations(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_conditions_related_alert ON public.license_conditions(related_alert_id);
CREATE INDEX IF NOT EXISTS idx_conditions_completion_date ON public.license_conditions(completion_date);
CREATE INDEX IF NOT EXISTS idx_conditions_compliance_impact ON public.license_conditions(compliance_impact);
CREATE INDEX IF NOT EXISTS idx_alerts_source_condition ON public.license_alerts(source_condition_id);
CREATE INDEX IF NOT EXISTS idx_alerts_related_observation ON public.license_alerts(related_observation_id);

COMMENT ON COLUMN public.license_conditions.completion_notes IS 'Notas adicionadas ao concluir a condicionante';
COMMENT ON COLUMN public.license_conditions.related_alert_id IS 'Alerta gerado automaticamente para esta condicionante';
COMMENT ON COLUMN public.license_conditions.related_observation_ids IS 'Array de IDs de observações vinculadas';
COMMENT ON COLUMN public.license_conditions.compliance_impact IS 'Impacto no compliance geral da empresa';
COMMENT ON COLUMN public.license_alerts.source_condition_id IS 'Condicionante que originou este alerta';
COMMENT ON COLUMN public.license_alerts.related_observation_id IS 'Observação relacionada a este alerta';