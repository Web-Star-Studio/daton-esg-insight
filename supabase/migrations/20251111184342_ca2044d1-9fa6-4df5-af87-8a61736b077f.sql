-- PHASE 4: Criar tabelas de auditoria robustas para segurança e rastreamento

-- Tabela de auditoria de processamento de documentos
CREATE TABLE IF NOT EXISTS public.document_processing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('upload', 'parse', 'classify', 'extract', 'approve', 'reject', 'edit', 'delete')),
  pipeline_step TEXT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_processing_audit_company ON public.document_processing_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_audit_document ON public.document_processing_audit(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_audit_created ON public.document_processing_audit(created_at DESC);

-- Tabela de auditoria de aprovação de dados
CREATE TABLE IF NOT EXISTS public.data_approval_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  preview_id UUID REFERENCES public.extracted_data_preview(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  approved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'edited', 'batch_approved')),
  original_data JSONB,
  edited_data JSONB,
  confidence_scores JSONB,
  target_table TEXT,
  records_affected INTEGER DEFAULT 0,
  approval_notes TEXT,
  processing_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_approval_audit_company ON public.data_approval_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_data_approval_audit_preview ON public.data_approval_audit(preview_id);
CREATE INDEX IF NOT EXISTS idx_data_approval_audit_created ON public.data_approval_audit(created_at DESC);

-- Tabela de auditoria de mudanças em campos
CREATE TABLE IF NOT EXISTS public.field_changes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_source TEXT CHECK (change_source IN ('manual', 'ai_extraction', 'api', 'import')),
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_changes_audit_company ON public.field_changes_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_field_changes_audit_table_record ON public.field_changes_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_field_changes_audit_created ON public.field_changes_audit(created_at DESC);

-- Habilitar RLS em todas as tabelas de auditoria
ALTER TABLE public.document_processing_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_approval_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_changes_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies para document_processing_audit
DROP POLICY IF EXISTS "Users can view their company's processing audit" ON public.document_processing_audit;
CREATE POLICY "Users can view their company's processing audit"
  ON public.document_processing_audit FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert processing audit" ON public.document_processing_audit;
CREATE POLICY "System can insert processing audit"
  ON public.document_processing_audit FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies para data_approval_audit
DROP POLICY IF EXISTS "Users can view their company's approval audit" ON public.data_approval_audit;
CREATE POLICY "Users can view their company's approval audit"
  ON public.data_approval_audit FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert approval audit" ON public.data_approval_audit;
CREATE POLICY "Users can insert approval audit"
  ON public.data_approval_audit FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies para field_changes_audit
DROP POLICY IF EXISTS "Users can view their company's field changes" ON public.field_changes_audit;
CREATE POLICY "Users can view their company's field changes"
  ON public.field_changes_audit FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert field changes" ON public.field_changes_audit;
CREATE POLICY "System can insert field changes"
  ON public.field_changes_audit FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.document_processing_audit IS 'Auditoria completa de processamento de documentos com IA';
COMMENT ON TABLE public.data_approval_audit IS 'Auditoria de aprovações/rejeições de dados extraídos';
COMMENT ON TABLE public.field_changes_audit IS 'Auditoria de mudanças em campos individuais do sistema';