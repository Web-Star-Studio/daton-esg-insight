-- Tabela de Documentação Obrigatória [DOC]
CREATE TABLE public.supplier_required_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK (weight >= 1 AND weight <= 5),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Tipos de Fornecedor [TIP]
CREATE TABLE public.supplier_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_type_id UUID REFERENCES public.supplier_types(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Cadastro de Fornecedores [FORN]
CREATE TABLE public.supplier_management (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_type TEXT NOT NULL CHECK (person_type IN ('PF', 'PJ')),
    
    -- Campos PF
    full_name TEXT,
    cpf TEXT,
    
    -- Campos PJ
    company_name TEXT,
    cnpj TEXT,
    responsible_name TEXT,
    
    -- Campos comuns
    nickname TEXT,
    full_address TEXT NOT NULL,
    phone_1 TEXT NOT NULL,
    phone_2 TEXT,
    email TEXT,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    temporary_password TEXT,
    access_code TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Suspenso')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints de validação
    CONSTRAINT valid_pf_fields CHECK (
        person_type != 'PF' OR (full_name IS NOT NULL AND cpf IS NOT NULL)
    ),
    CONSTRAINT valid_pj_fields CHECK (
        person_type != 'PJ' OR (company_name IS NOT NULL AND cnpj IS NOT NULL AND responsible_name IS NOT NULL AND email IS NOT NULL)
    )
);

-- Tabela de Vinculação Fornecedor-Tipo
CREATE TABLE public.supplier_type_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES public.supplier_management(id) ON DELETE CASCADE,
    supplier_type_id UUID NOT NULL REFERENCES public.supplier_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(supplier_id, supplier_type_id)
);

-- Tabela de Conexões entre Fornecedores (Logística Reversa)
CREATE TABLE public.supplier_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    primary_supplier_id UUID NOT NULL REFERENCES public.supplier_management(id) ON DELETE CASCADE,
    connected_supplier_id UUID NOT NULL REFERENCES public.supplier_management(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL DEFAULT 'logistica_reversa' CHECK (connection_type IN ('logistica_reversa', 'material_perigoso', 'outro')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT different_suppliers CHECK (primary_supplier_id != connected_supplier_id)
);

-- Tabela de Documentos Enviados pelo Fornecedor
CREATE TABLE public.supplier_document_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.supplier_management(id) ON DELETE CASCADE,
    required_document_id UUID NOT NULL REFERENCES public.supplier_required_documents(id) ON DELETE CASCADE,
    file_path TEXT,
    file_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado')),
    evaluated_by UUID REFERENCES public.profiles(id),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    score INTEGER CHECK (score IS NULL OR (score >= 1 AND score <= 5)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.supplier_required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_document_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para supplier_required_documents
CREATE POLICY "Users can view required documents from their company"
ON public.supplier_required_documents FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create required documents for their company"
ON public.supplier_required_documents FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update required documents from their company"
ON public.supplier_required_documents FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete required documents from their company"
ON public.supplier_required_documents FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas RLS para supplier_types
CREATE POLICY "Users can view supplier types from their company"
ON public.supplier_types FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create supplier types for their company"
ON public.supplier_types FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update supplier types from their company"
ON public.supplier_types FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete supplier types from their company"
ON public.supplier_types FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas RLS para supplier_management
CREATE POLICY "Users can view suppliers from their company"
ON public.supplier_management FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create suppliers for their company"
ON public.supplier_management FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update suppliers from their company"
ON public.supplier_management FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete suppliers from their company"
ON public.supplier_management FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas RLS para supplier_type_assignments
CREATE POLICY "Users can view type assignments via supplier"
ON public.supplier_type_assignments FOR SELECT
USING (supplier_id IN (
    SELECT id FROM public.supplier_management 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create type assignments for their suppliers"
ON public.supplier_type_assignments FOR INSERT
WITH CHECK (supplier_id IN (
    SELECT id FROM public.supplier_management 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can delete type assignments for their suppliers"
ON public.supplier_type_assignments FOR DELETE
USING (supplier_id IN (
    SELECT id FROM public.supplier_management 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

-- Políticas RLS para supplier_connections
CREATE POLICY "Users can view connections from their company"
ON public.supplier_connections FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create connections for their company"
ON public.supplier_connections FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update connections from their company"
ON public.supplier_connections FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete connections from their company"
ON public.supplier_connections FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas RLS para supplier_document_submissions
CREATE POLICY "Users can view document submissions from their company"
ON public.supplier_document_submissions FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create document submissions for their company"
ON public.supplier_document_submissions FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update document submissions from their company"
ON public.supplier_document_submissions FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete document submissions from their company"
ON public.supplier_document_submissions FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Índices para performance
CREATE INDEX idx_supplier_required_documents_company ON public.supplier_required_documents(company_id);
CREATE INDEX idx_supplier_types_company ON public.supplier_types(company_id);
CREATE INDEX idx_supplier_types_parent ON public.supplier_types(parent_type_id);
CREATE INDEX idx_supplier_management_company ON public.supplier_management(company_id);
CREATE INDEX idx_supplier_management_status ON public.supplier_management(status);
CREATE INDEX idx_supplier_type_assignments_supplier ON public.supplier_type_assignments(supplier_id);
CREATE INDEX idx_supplier_connections_company ON public.supplier_connections(company_id);
CREATE INDEX idx_supplier_connections_primary ON public.supplier_connections(primary_supplier_id);
CREATE INDEX idx_supplier_document_submissions_supplier ON public.supplier_document_submissions(supplier_id);

-- Triggers para updated_at
CREATE TRIGGER update_supplier_required_documents_updated_at
BEFORE UPDATE ON public.supplier_required_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_types_updated_at
BEFORE UPDATE ON public.supplier_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_management_updated_at
BEFORE UPDATE ON public.supplier_management
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_connections_updated_at
BEFORE UPDATE ON public.supplier_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_document_submissions_updated_at
BEFORE UPDATE ON public.supplier_document_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();