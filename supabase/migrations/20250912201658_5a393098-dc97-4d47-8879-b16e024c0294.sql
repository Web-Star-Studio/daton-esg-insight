-- Criar tabelas para análise inteligente de licenças
CREATE TABLE public.license_ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'full_analysis',
  ai_insights JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'completed',
  processing_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'gpt-4-vision-preview',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para condicionantes extraídas automaticamente
CREATE TABLE public.license_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  condition_text TEXT NOT NULL,
  condition_category TEXT,
  due_date DATE,
  frequency frequency_enum,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  responsible_user_id UUID,
  ai_extracted BOOLEAN NOT NULL DEFAULT true,
  ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para alertas inteligentes
CREATE TABLE public.license_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID,
  action_required BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas de IA à tabela licenses existente
ALTER TABLE public.licenses 
ADD COLUMN ai_processing_status TEXT DEFAULT 'not_processed',
ADD COLUMN ai_confidence_score NUMERIC CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN ai_extracted_data JSONB DEFAULT '{}',
ADD COLUMN ai_last_analysis_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN compliance_score NUMERIC CHECK (compliance_score >= 0 AND compliance_score <= 100);

-- Habilitar RLS
ALTER TABLE public.license_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para license_ai_analysis
CREATE POLICY "Users can manage their company license analysis" 
ON public.license_ai_analysis 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para license_conditions
CREATE POLICY "Users can manage their company license conditions" 
ON public.license_conditions 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para license_alerts
CREATE POLICY "Users can manage their company license alerts" 
ON public.license_alerts 
FOR ALL 
USING (company_id = get_user_company_id());

-- Criar índices para performance
CREATE INDEX idx_license_ai_analysis_license_id ON public.license_ai_analysis(license_id);
CREATE INDEX idx_license_ai_analysis_company_id ON public.license_ai_analysis(company_id);
CREATE INDEX idx_license_conditions_license_id ON public.license_conditions(license_id);
CREATE INDEX idx_license_conditions_due_date ON public.license_conditions(due_date);
CREATE INDEX idx_license_alerts_license_id ON public.license_alerts(license_id);
CREATE INDEX idx_license_alerts_severity ON public.license_alerts(severity);
CREATE INDEX idx_license_alerts_is_resolved ON public.license_alerts(is_resolved);

-- Trigger para updated_at
CREATE TRIGGER update_license_ai_analysis_updated_at
BEFORE UPDATE ON public.license_ai_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_license_conditions_updated_at
BEFORE UPDATE ON public.license_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_license_alerts_updated_at
BEFORE UPDATE ON public.license_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();