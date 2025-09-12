-- Criar tabela para jobs de extração de documentos
CREATE TABLE public.document_extraction_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'Processando',
  processing_type TEXT NOT NULL, -- 'ocr_pdf', 'excel_parse', 'csv_parse'
  confidence_score NUMERIC DEFAULT 0,
  ai_model_used TEXT DEFAULT 'gpt-4-vision-preview',
  error_message TEXT,
  processing_start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processing_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para dados extraídos aguardando aprovação
CREATE TABLE public.extracted_data_preview (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extraction_job_id UUID NOT NULL,
  company_id UUID NOT NULL,
  target_table TEXT NOT NULL, -- 'activity_data', 'waste_logs', etc
  extracted_fields JSONB NOT NULL DEFAULT '{}',
  confidence_scores JSONB NOT NULL DEFAULT '{}', -- score por campo
  suggested_mappings JSONB NOT NULL DEFAULT '{}', -- mapeamentos sugeridos
  validation_status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Aprovado', 'Rejeitado'
  validation_notes TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para padrões de extração aprendidos
CREATE TABLE public.ai_extraction_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'energy_invoice', 'waste_spreadsheet', etc
  field_patterns JSONB NOT NULL DEFAULT '{}',
  extraction_rules JSONB NOT NULL DEFAULT '{}',
  success_count INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar nova coluna na tabela documents para trackear processamento IA
ALTER TABLE public.documents 
ADD COLUMN ai_processing_status TEXT DEFAULT NULL,
ADD COLUMN ai_extracted_category TEXT DEFAULT NULL,
ADD COLUMN ai_confidence_score NUMERIC DEFAULT NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.document_extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data_preview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_extraction_patterns ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para document_extraction_jobs
CREATE POLICY "Users can manage their company extraction jobs" 
ON public.document_extraction_jobs 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para extracted_data_preview
CREATE POLICY "Users can manage their company extracted data" 
ON public.extracted_data_preview 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para ai_extraction_patterns
CREATE POLICY "Users can manage their company AI patterns" 
ON public.ai_extraction_patterns 
FOR ALL 
USING (company_id = get_user_company_id());

-- Criar índices para performance
CREATE INDEX idx_document_extraction_jobs_company_status ON public.document_extraction_jobs(company_id, status);
CREATE INDEX idx_extracted_data_preview_job_id ON public.extracted_data_preview(extraction_job_id);
CREATE INDEX idx_ai_extraction_patterns_company_type ON public.ai_extraction_patterns(company_id, document_type);

-- Função para atualizar updated_at automaticamente
CREATE TRIGGER update_document_extraction_jobs_updated_at
BEFORE UPDATE ON public.document_extraction_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extracted_data_preview_updated_at
BEFORE UPDATE ON public.extracted_data_preview
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_extraction_patterns_updated_at
BEFORE UPDATE ON public.ai_extraction_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();