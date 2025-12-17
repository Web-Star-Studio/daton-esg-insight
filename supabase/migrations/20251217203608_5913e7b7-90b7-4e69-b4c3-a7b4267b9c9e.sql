-- =============================================
-- FASE 4: Execução & Coleta de Evidências
-- =============================================

-- Tabela de respostas por item
CREATE TABLE IF NOT EXISTS public.audit_item_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_item_id UUID NOT NULL REFERENCES public.audit_session_items(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    response_option_id UUID REFERENCES public.audit_response_options(id),
    response_value TEXT,
    justification TEXT,
    strengths TEXT,
    weaknesses TEXT,
    observations TEXT,
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de anexos/evidências por item
CREATE TABLE IF NOT EXISTS public.audit_item_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.audit_item_responses(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ocorrências (NCs e OMs)
CREATE TABLE IF NOT EXISTS public.audit_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.audit_sessions(id) ON DELETE SET NULL,
    session_item_id UUID REFERENCES public.audit_session_items(id) ON DELETE SET NULL,
    response_id UUID REFERENCES public.audit_item_responses(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    occurrence_type TEXT NOT NULL CHECK (occurrence_type IN ('NC_maior', 'NC_menor', 'OM', 'Observacao')),
    occurrence_number TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    root_cause TEXT,
    immediate_action TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    responsible_user_id UUID REFERENCES auth.users(id),
    due_date DATE,
    status TEXT DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Em_Tratamento', 'Aguardando_Verificacao', 'Fechada', 'Cancelada')),
    priority TEXT DEFAULT 'Media' CHECK (priority IN ('Baixa', 'Media', 'Alta', 'Critica')),
    evidence_required BOOLEAN DEFAULT true,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_item_responses_session_item ON public.audit_item_responses(session_item_id);
CREATE INDEX IF NOT EXISTS idx_audit_item_responses_audit ON public.audit_item_responses(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_item_responses_company ON public.audit_item_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_item_attachments_response ON public.audit_item_attachments(response_id);
CREATE INDEX IF NOT EXISTS idx_audit_item_attachments_audit ON public.audit_item_attachments(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurrences_audit ON public.audit_occurrences(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurrences_session ON public.audit_occurrences(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurrences_status ON public.audit_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_audit_occurrences_company ON public.audit_occurrences(company_id);

-- RLS Policies
ALTER TABLE public.audit_item_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_item_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies for audit_item_responses
CREATE POLICY "Users can view responses from their company"
    ON public.audit_item_responses FOR SELECT
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert responses for their company"
    ON public.audit_item_responses FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update responses from their company"
    ON public.audit_item_responses FOR UPDATE
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete responses from their company"
    ON public.audit_item_responses FOR DELETE
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for audit_item_attachments
CREATE POLICY "Users can view attachments from their company"
    ON public.audit_item_attachments FOR SELECT
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert attachments for their company"
    ON public.audit_item_attachments FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete attachments from their company"
    ON public.audit_item_attachments FOR DELETE
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for audit_occurrences
CREATE POLICY "Users can view occurrences from their company"
    ON public.audit_occurrences FOR SELECT
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert occurrences for their company"
    ON public.audit_occurrences FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update occurrences from their company"
    ON public.audit_occurrences FOR UPDATE
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete occurrences from their company"
    ON public.audit_occurrences FOR DELETE
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_audit_item_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_item_responses_updated_at
    BEFORE UPDATE ON public.audit_item_responses
    FOR EACH ROW EXECUTE FUNCTION update_audit_item_responses_updated_at();

CREATE OR REPLACE FUNCTION update_audit_occurrences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_occurrences_updated_at
    BEFORE UPDATE ON public.audit_occurrences
    FOR EACH ROW EXECUTE FUNCTION update_audit_occurrences_updated_at();

-- Função para atualizar progresso da sessão ao responder item
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_total_items INTEGER;
    v_responded_items INTEGER;
BEGIN
    -- Buscar session_id do item
    SELECT asi.session_id INTO v_session_id
    FROM public.audit_session_items asi
    WHERE asi.id = NEW.session_item_id;
    
    -- Contar total de itens e respondidos
    SELECT COUNT(*) INTO v_total_items
    FROM public.audit_session_items
    WHERE session_id = v_session_id;
    
    SELECT COUNT(DISTINCT air.session_item_id) INTO v_responded_items
    FROM public.audit_item_responses air
    JOIN public.audit_session_items asi ON air.session_item_id = asi.id
    WHERE asi.session_id = v_session_id;
    
    -- Atualizar sessão
    UPDATE public.audit_sessions
    SET total_items = v_total_items,
        responded_items = v_responded_items,
        status = CASE 
            WHEN v_responded_items = 0 THEN 'Pendente'
            WHEN v_responded_items < v_total_items THEN 'Em_Andamento'
            ELSE 'Concluida'
        END,
        updated_at = now()
    WHERE id = v_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_session_progress
    AFTER INSERT OR UPDATE ON public.audit_item_responses
    FOR EACH ROW EXECUTE FUNCTION update_session_progress();

-- Função para gerar número de ocorrência
CREATE OR REPLACE FUNCTION generate_occurrence_number()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_prefix TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    v_prefix := CASE NEW.occurrence_type
        WHEN 'NC_maior' THEN 'NCM'
        WHEN 'NC_menor' THEN 'NCm'
        WHEN 'OM' THEN 'OM'
        ELSE 'OBS'
    END;
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.audit_occurrences
    WHERE company_id = NEW.company_id
    AND occurrence_type = NEW.occurrence_type
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    NEW.occurrence_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_occurrence_number
    BEFORE INSERT ON public.audit_occurrences
    FOR EACH ROW EXECUTE FUNCTION generate_occurrence_number();