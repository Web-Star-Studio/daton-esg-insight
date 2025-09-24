-- ====================================
-- GED (Gestão Eletrônica de Documentos) Module
-- ====================================

-- Create enum types for GED
CREATE TYPE document_type_enum AS ENUM ('interno', 'externo', 'registro', 'legal');
CREATE TYPE approval_status_enum AS ENUM ('rascunho', 'em_aprovacao', 'aprovado', 'rejeitado', 'obsoleto');
CREATE TYPE review_frequency_enum AS ENUM ('mensal', 'trimestral', 'semestral', 'anual', 'bienal');
CREATE TYPE permission_level_enum AS ENUM ('leitura', 'escrita', 'aprovacao', 'admin');
CREATE TYPE workflow_step_type_enum AS ENUM ('approval', 'review', 'notification');

-- Document versions table for advanced version control
CREATE TABLE public.document_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_hash TEXT,
    file_path TEXT,
    file_size BIGINT,
    changes_summary TEXT,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_current BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    UNIQUE(document_id, version_number)
);

-- Approval workflows table
CREATE TABLE public.document_approval_workflows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document approvals table
CREATE TABLE public.document_approvals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES document_approval_workflows(id),
    current_step INTEGER NOT NULL DEFAULT 1,
    status approval_status_enum NOT NULL DEFAULT 'em_aprovacao',
    approver_user_id UUID,
    approval_date TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Master list configuration
CREATE TABLE public.document_master_list (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    effective_date DATE,
    review_date DATE,
    responsible_department TEXT,
    distribution_list JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

-- Controlled copies tracking
CREATE TABLE public.document_controlled_copies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    copy_number INTEGER NOT NULL,
    assigned_to_user_id UUID,
    assigned_department TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'ativa',
    distributed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT
);

-- Document permissions table for granular access control
CREATE TABLE public.document_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    user_id UUID,
    role TEXT,
    permission_level permission_level_enum NOT NULL,
    granted_by_user_id UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT check_document_or_folder CHECK (
        (document_id IS NOT NULL AND folder_id IS NULL) OR 
        (document_id IS NULL AND folder_id IS NOT NULL)
    )
);

-- Audit trail for complete traceability
CREATE TABLE public.document_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_id UUID NOT NULL,
    user_ip_address INET,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    details TEXT
);

-- Legal documents registry
CREATE TABLE public.legal_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    legislation_type TEXT NOT NULL,
    law_number TEXT,
    publication_date DATE,
    effective_date DATE,
    expiration_date DATE,
    issuing_authority TEXT,
    subject TEXT NOT NULL,
    compliance_status TEXT DEFAULT 'em_analise',
    review_frequency review_frequency_enum DEFAULT 'anual',
    next_review_date DATE,
    responsible_user_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend documents table with GED fields
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_type document_type_enum DEFAULT 'interno',
ADD COLUMN IF NOT EXISTS controlled_copy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status approval_status_enum DEFAULT 'rascunho',
ADD COLUMN IF NOT EXISTS master_list_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retention_period INTERVAL,
ADD COLUMN IF NOT EXISTS review_frequency review_frequency_enum DEFAULT 'anual',
ADD COLUMN IF NOT EXISTS next_review_date DATE,
ADD COLUMN IF NOT EXISTS effective_date DATE,
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS responsible_department TEXT,
ADD COLUMN IF NOT EXISTS distribution_list JSONB DEFAULT '[]';

-- Enable RLS on all new tables
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_master_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_controlled_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_versions
CREATE POLICY "Users can manage document versions from their company" 
ON public.document_versions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_versions.document_id 
        AND d.company_id = get_user_company_id()
    )
);

-- RLS Policies for document_approval_workflows
CREATE POLICY "Users can manage their company approval workflows" 
ON public.document_approval_workflows FOR ALL 
USING (company_id = get_user_company_id());

-- RLS Policies for document_approvals
CREATE POLICY "Users can manage approvals from their company documents" 
ON public.document_approvals FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_approvals.document_id 
        AND d.company_id = get_user_company_id()
    )
);

-- RLS Policies for document_master_list
CREATE POLICY "Users can manage their company master list" 
ON public.document_master_list FOR ALL 
USING (company_id = get_user_company_id());

-- RLS Policies for document_controlled_copies
CREATE POLICY "Users can manage controlled copies from their company documents" 
ON public.document_controlled_copies FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_controlled_copies.document_id 
        AND d.company_id = get_user_company_id()
    )
);

-- RLS Policies for document_permissions
CREATE POLICY "Users can manage permissions from their company documents" 
ON public.document_permissions FOR ALL 
USING (
    CASE 
        WHEN document_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_permissions.document_id 
                AND d.company_id = get_user_company_id()
            )
        WHEN folder_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM document_folders df 
                WHERE df.id = document_permissions.folder_id 
                AND df.company_id = get_user_company_id()
            )
        ELSE false
    END
);

-- RLS Policies for document_audit_trail
CREATE POLICY "Users can view audit trail from their company documents" 
ON public.document_audit_trail FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_audit_trail.document_id 
        AND d.company_id = get_user_company_id()
    )
);

CREATE POLICY "System can insert audit trail records" 
ON public.document_audit_trail FOR INSERT 
WITH CHECK (true);

-- RLS Policies for legal_documents
CREATE POLICY "Users can manage their company legal documents" 
ON public.legal_documents FOR ALL 
USING (company_id = get_user_company_id());

-- Create indexes for performance
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_version_number ON public.document_versions(version_number);
CREATE INDEX idx_document_approvals_document_id ON public.document_approvals(document_id);
CREATE INDEX idx_document_approvals_status ON public.document_approvals(status);
CREATE INDEX idx_document_master_list_company_id ON public.document_master_list(company_id);
CREATE INDEX idx_document_controlled_copies_document_id ON public.document_controlled_copies(document_id);
CREATE INDEX idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_folder_id ON public.document_permissions(folder_id);
CREATE INDEX idx_document_audit_trail_document_id ON public.document_audit_trail(document_id);
CREATE INDEX idx_document_audit_trail_timestamp ON public.document_audit_trail(timestamp);
CREATE INDEX idx_legal_documents_company_id ON public.legal_documents(company_id);

-- Triggers for automatic version management
CREATE OR REPLACE FUNCTION public.create_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial version when document is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.document_versions (
            document_id,
            version_number,
            title,
            file_path,
            file_size,
            created_by_user_id,
            is_current
        ) VALUES (
            NEW.id,
            1,
            NEW.file_name,
            NEW.file_path,
            NEW.file_size,
            NEW.uploader_user_id,
            true
        );
        
        -- Log audit trail
        INSERT INTO public.document_audit_trail (
            document_id,
            action,
            user_id,
            new_values
        ) VALUES (
            NEW.id,
            'CREATE',
            NEW.uploader_user_id,
            to_jsonb(NEW)
        );
        
        RETURN NEW;
    END IF;
    
    -- Create new version when document is updated
    IF TG_OP = 'UPDATE' AND (OLD.file_path != NEW.file_path OR OLD.file_size != NEW.file_size) THEN
        -- Mark current version as not current
        UPDATE public.document_versions 
        SET is_current = false 
        WHERE document_id = NEW.id AND is_current = true;
        
        -- Create new version
        INSERT INTO public.document_versions (
            document_id,
            version_number,
            title,
            file_path,
            file_size,
            created_by_user_id,
            is_current
        ) VALUES (
            NEW.id,
            (SELECT COALESCE(MAX(version_number), 0) + 1 FROM public.document_versions WHERE document_id = NEW.id),
            NEW.file_name,
            NEW.file_path,
            NEW.file_size,
            NEW.uploader_user_id,
            true
        );
        
        -- Log audit trail
        INSERT INTO public.document_audit_trail (
            document_id,
            action,
            user_id,
            old_values,
            new_values
        ) VALUES (
            NEW.id,
            'UPDATE',
            NEW.uploader_user_id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for document deletion audit
CREATE OR REPLACE FUNCTION public.log_document_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.document_audit_trail (
        document_id,
        action,
        user_id,
        old_values
    ) VALUES (
        OLD.id,
        'DELETE',
        auth.uid(),
        to_jsonb(OLD)
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
CREATE TRIGGER document_version_trigger
    AFTER INSERT OR UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.create_document_version();

CREATE TRIGGER document_deletion_audit_trigger
    BEFORE DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.log_document_deletion();