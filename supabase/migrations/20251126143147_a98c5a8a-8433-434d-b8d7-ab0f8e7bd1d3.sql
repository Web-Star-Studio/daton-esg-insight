-- Criar tabela de vinculação de áreas com auditorias
CREATE TABLE IF NOT EXISTS public.audit_area_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.audit_areas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  audited_at TIMESTAMP WITH TIME ZONE,
  auditor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(audit_id, area_id)
);

-- Criar tabela de evidências de auditoria
CREATE TABLE IF NOT EXISTS public.audit_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES public.audit_findings(id) ON DELETE CASCADE,
  checklist_response_id UUID REFERENCES public.audit_checklist_responses(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audit_area_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_evidence ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para audit_area_assignments
CREATE POLICY "Users can view assignments from their company"
ON public.audit_area_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_area_assignments.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create assignments for their company audits"
ON public.audit_area_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_area_assignments.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update assignments from their company"
ON public.audit_area_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_area_assignments.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete assignments from their company"
ON public.audit_area_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_area_assignments.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Políticas de segurança para audit_evidence
CREATE POLICY "Users can view evidence from their company audits"
ON public.audit_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_evidence.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload evidence to their company audits"
ON public.audit_evidence
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = audit_evidence.audit_id
    AND audits.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own evidence"
ON public.audit_evidence
FOR DELETE
USING (uploaded_by_user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_audit_area_assignments_updated_at
BEFORE UPDATE ON public.audit_area_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Mensagem de confirmação
SELECT 'Tabelas de unificação criadas com sucesso!' as resultado;