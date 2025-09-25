-- Contratos de Fornecedores
CREATE TABLE public.supplier_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100) NOT NULL DEFAULT 'Serviços',
    value NUMERIC(15,2),
    currency VARCHAR(10) DEFAULT 'BRL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renewal BOOLEAN DEFAULT FALSE,
    renewal_notice_days INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'Ativo',
    terms_conditions TEXT,
    sla_requirements JSONB DEFAULT '{}',
    payment_terms VARCHAR(255),
    responsible_user_id UUID,
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Acordos Internos
CREATE TABLE public.internal_agreements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    client_company_id UUID,
    supplier_company_id UUID,
    agreement_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    agreement_type VARCHAR(100) NOT NULL DEFAULT 'Comercial',
    scope TEXT,
    deliverables JSONB DEFAULT '[]',
    milestones JSONB DEFAULT '[]',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Em Negociação',
    approval_workflow JSONB DEFAULT '{}',
    signatures JSONB DEFAULT '[]',
    version VARCHAR(20) DEFAULT '1.0',
    parent_agreement_id UUID,
    responsible_user_id UUID,
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ouvidoria - Reclamações de Clientes
CREATE TABLE public.customer_complaints (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    complaint_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_document VARCHAR(50),
    complaint_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Média',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Aberta',
    assigned_to_user_id UUID,
    resolution_target_date DATE,
    resolution_date DATE,
    resolution_description TEXT,
    customer_satisfaction_rating INTEGER,
    customer_satisfaction_feedback TEXT,
    communication_log JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    sla_met BOOLEAN,
    escalated BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pesquisas de Satisfação
CREATE TABLE public.satisfaction_surveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    survey_type VARCHAR(100) NOT NULL DEFAULT 'Cliente Externo',
    target_audience VARCHAR(100) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Rascunho',
    start_date DATE,
    end_date DATE,
    anonymous BOOLEAN DEFAULT TRUE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Métricas de Performance do Fornecedor
CREATE TABLE public.supplier_performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    quality_score NUMERIC(5,2),
    delivery_score NUMERIC(5,2),
    cost_performance_score NUMERIC(5,2),
    service_level_score NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    contracts_active INTEGER DEFAULT 0,
    contracts_total INTEGER DEFAULT 0,
    incidents_count INTEGER DEFAULT 0,
    complaints_count INTEGER DEFAULT 0,
    sla_compliance_percentage NUMERIC(5,2),
    metrics_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para supplier_contracts
CREATE POLICY "Users can manage their company supplier contracts"
ON public.supplier_contracts FOR ALL
USING (company_id = get_user_company_id());

-- Políticas RLS para internal_agreements
CREATE POLICY "Users can manage their company internal agreements"
ON public.internal_agreements FOR ALL
USING (company_id = get_user_company_id());

-- Políticas RLS para customer_complaints
CREATE POLICY "Users can manage their company customer complaints"
ON public.customer_complaints FOR ALL
USING (company_id = get_user_company_id());

-- Políticas RLS para satisfaction_surveys
CREATE POLICY "Users can manage their company satisfaction surveys"
ON public.satisfaction_surveys FOR ALL
USING (company_id = get_user_company_id());

-- Políticas RLS para supplier_performance_metrics
CREATE POLICY "Users can manage their company supplier metrics"
ON public.supplier_performance_metrics FOR ALL
USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_supplier_contracts_updated_at
    BEFORE UPDATE ON public.supplier_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_agreements_updated_at
    BEFORE UPDATE ON public.internal_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_complaints_updated_at
    BEFORE UPDATE ON public.customer_complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_satisfaction_surveys_updated_at
    BEFORE UPDATE ON public.satisfaction_surveys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_performance_metrics_updated_at
    BEFORE UPDATE ON public.supplier_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_supplier_contracts_company_id ON public.supplier_contracts(company_id);
CREATE INDEX idx_supplier_contracts_supplier_id ON public.supplier_contracts(supplier_id);
CREATE INDEX idx_supplier_contracts_status ON public.supplier_contracts(status);
CREATE INDEX idx_supplier_contracts_end_date ON public.supplier_contracts(end_date);

CREATE INDEX idx_internal_agreements_company_id ON public.internal_agreements(company_id);
CREATE INDEX idx_internal_agreements_status ON public.internal_agreements(status);

CREATE INDEX idx_customer_complaints_company_id ON public.customer_complaints(company_id);
CREATE INDEX idx_customer_complaints_status ON public.customer_complaints(status);
CREATE INDEX idx_customer_complaints_priority ON public.customer_complaints(priority);

CREATE INDEX idx_satisfaction_surveys_company_id ON public.satisfaction_surveys(company_id);
CREATE INDEX idx_satisfaction_surveys_status ON public.satisfaction_surveys(status);

CREATE INDEX idx_supplier_performance_metrics_company_id ON public.supplier_performance_metrics(company_id);
CREATE INDEX idx_supplier_performance_metrics_supplier_id ON public.supplier_performance_metrics(supplier_id);