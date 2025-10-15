-- ===================================================
-- FASE 1: TABELAS PARA SISTEMA UNIVERSAL DE DOCUMENTOS
-- ===================================================

-- Tabela para dados não classificados (Modo Exploratório)
CREATE TABLE IF NOT EXISTS public.unclassified_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  ai_confidence NUMERIC DEFAULT 0,
  data_category TEXT,
  potential_tables TEXT[],
  user_decision TEXT,
  decided_by_user_id UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_unclassified_data_company ON public.unclassified_data(company_id);
CREATE INDEX IF NOT EXISTS idx_unclassified_data_document ON public.unclassified_data(document_id);
CREATE INDEX IF NOT EXISTS idx_unclassified_data_decision ON public.unclassified_data(user_decision) WHERE user_decision IS NULL;

-- RLS para unclassified_data
ALTER TABLE public.unclassified_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company unclassified data"
ON public.unclassified_data
FOR ALL
TO authenticated
USING (company_id = get_user_company_id());

-- ===================================================
-- FASE 2: REGRAS DE AUTOMAÇÃO
-- ===================================================

-- Tabela para regras de automação inteligente
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  description TEXT,
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL, -- 'create_task', 'notify', 'auto_insert', 'create_alert'
  action_parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_automation_rules_company ON public.automation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(is_active) WHERE is_active = true;

-- RLS para automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company automation rules"
ON public.automation_rules
FOR ALL
TO authenticated
USING (company_id = get_user_company_id());

-- ===================================================
-- FASE 3: FEEDBACK DE EXTRAÇÕES
-- ===================================================

-- Tabela para feedback e aprendizado contínuo
CREATE TABLE IF NOT EXISTS public.extraction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  preview_id UUID REFERENCES public.extracted_data_preview(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  feedback_type TEXT NOT NULL, -- 'excellent', 'good', 'fair', 'poor'
  accuracy_score INTEGER CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  issues JSONB DEFAULT '[]'::jsonb, -- array de campos problemáticos
  suggestions TEXT,
  time_to_review_seconds INTEGER,
  fields_corrected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_extraction_feedback_company ON public.extraction_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_extraction_feedback_preview ON public.extraction_feedback(preview_id);
CREATE INDEX IF NOT EXISTS idx_extraction_feedback_type ON public.extraction_feedback(feedback_type);

-- RLS para extraction_feedback
ALTER TABLE public.extraction_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company extraction feedback"
ON public.extraction_feedback
FOR ALL
TO authenticated
USING (company_id = get_user_company_id());

-- ===================================================
-- FASE 4: HISTÓRICO DE APRENDIZADO DA IA
-- ===================================================

-- Tabela para padrões aprendidos pela IA
CREATE TABLE IF NOT EXISTS public.document_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'layout', 'field_mapping', 'entity_recognition'
  pattern_signature TEXT NOT NULL, -- hash do padrão
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, pattern_type, pattern_signature)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_document_patterns_company ON public.document_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_document_patterns_confidence ON public.document_patterns(confidence_score DESC);

-- RLS para document_patterns
ALTER TABLE public.document_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company document patterns"
ON public.document_patterns
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

-- ===================================================
-- FASE 5: ANALYTICS DE PERFORMANCE DA IA
-- ===================================================

-- Tabela para métricas de performance
CREATE TABLE IF NOT EXISTS public.ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  documents_processed INTEGER DEFAULT 0,
  auto_approved_count INTEGER DEFAULT 0,
  manual_review_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  avg_confidence NUMERIC DEFAULT 0,
  avg_processing_time_seconds NUMERIC DEFAULT 0,
  total_fields_extracted INTEGER DEFAULT 0,
  fields_corrected INTEGER DEFAULT 0,
  accuracy_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, metric_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_performance_company ON public.ai_performance_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_date ON public.ai_performance_metrics(metric_date DESC);

-- RLS para ai_performance_metrics
ALTER TABLE public.ai_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company AI metrics"
ON public.ai_performance_metrics
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

-- ===================================================
-- FASE 6: FUNÇÕES AUXILIARES
-- ===================================================

-- Função para atualizar métricas de performance
CREATE OR REPLACE FUNCTION public.update_ai_performance_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar métricas quando um preview for aprovado/rejeitado
  INSERT INTO public.ai_performance_metrics (
    company_id,
    metric_date,
    documents_processed,
    auto_approved_count,
    manual_review_count
  )
  VALUES (
    NEW.company_id,
    CURRENT_DATE,
    1,
    CASE WHEN NEW.validation_status = 'Aprovado' THEN 1 ELSE 0 END,
    CASE WHEN NEW.validation_status IN ('Pendente', 'Aprovado', 'Rejeitado') THEN 1 ELSE 0 END
  )
  ON CONFLICT (company_id, metric_date)
  DO UPDATE SET
    documents_processed = ai_performance_metrics.documents_processed + 1,
    auto_approved_count = ai_performance_metrics.auto_approved_count + 
      CASE WHEN NEW.validation_status = 'Aprovado' THEN 1 ELSE 0 END,
    manual_review_count = ai_performance_metrics.manual_review_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar métricas automaticamente
DROP TRIGGER IF EXISTS trigger_update_ai_metrics ON public.extracted_data_preview;
CREATE TRIGGER trigger_update_ai_metrics
AFTER INSERT OR UPDATE OF validation_status ON public.extracted_data_preview
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_performance_metrics();

-- ===================================================
-- FASE 7: COMENTÁRIOS E DOCUMENTAÇÃO
-- ===================================================

COMMENT ON TABLE public.unclassified_data IS 'Armazena dados extraídos que não se encaixam em tabelas conhecidas - Modo Exploratório';
COMMENT ON TABLE public.automation_rules IS 'Regras de automação inteligente baseadas em extrações de documentos';
COMMENT ON TABLE public.extraction_feedback IS 'Feedback dos usuários sobre qualidade das extrações para aprendizado contínuo';
COMMENT ON TABLE public.document_patterns IS 'Padrões aprendidos pela IA para melhorar extrações futuras';
COMMENT ON TABLE public.ai_performance_metrics IS 'Métricas agregadas de performance da IA por dia';