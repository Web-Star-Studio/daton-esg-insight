-- Tabela de associação entre Documentos Obrigatórios [DOC] e Tipos de Fornecedor [TIP]
CREATE TABLE public.supplier_document_type_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_type_id UUID NOT NULL REFERENCES public.supplier_types(id) ON DELETE CASCADE,
  required_document_id UUID NOT NULL REFERENCES public.supplier_required_documents(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_type_id, required_document_id)
);

-- Índices
CREATE INDEX idx_doc_type_req_company ON public.supplier_document_type_requirements(company_id);
CREATE INDEX idx_doc_type_req_type ON public.supplier_document_type_requirements(supplier_type_id);
CREATE INDEX idx_doc_type_req_doc ON public.supplier_document_type_requirements(required_document_id);

-- RLS
ALTER TABLE public.supplier_document_type_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document type requirements from their company"
ON public.supplier_document_type_requirements FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert document type requirements for their company"
ON public.supplier_document_type_requirements FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update document type requirements from their company"
ON public.supplier_document_type_requirements FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete document type requirements from their company"
ON public.supplier_document_type_requirements FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));