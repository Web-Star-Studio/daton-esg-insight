-- Core SGQ Tables

-- Strategic Planning
CREATE TABLE public.strategic_maps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.bsc_perspectives (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    strategic_map_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.bsc_objectives (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    perspective_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Process Mapping
CREATE TABLE public.process_maps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    process_type TEXT DEFAULT 'Operacional',
    owner_user_id UUID,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.process_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    responsible_role TEXT,
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    activity_type TEXT DEFAULT 'Atividade',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk Management
CREATE TABLE public.risk_matrices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    matrix_type TEXT DEFAULT 'Operacional',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.risk_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_matrix_id UUID NOT NULL,
    risk_title TEXT NOT NULL,
    risk_description TEXT,
    category TEXT,
    probability TEXT NOT NULL,
    impact TEXT NOT NULL,
    risk_level TEXT,
    owner_user_id UUID,
    status TEXT DEFAULT 'Identificado',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.risk_treatments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_assessment_id UUID NOT NULL,
    treatment_type TEXT NOT NULL, -- Mitigar, Aceitar, Transferir, Evitar
    action_description TEXT NOT NULL,
    responsible_user_id UUID,
    due_date DATE,
    status TEXT DEFAULT 'Planejado',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Action Plans (5W2H)
CREATE TABLE public.action_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    plan_type TEXT DEFAULT 'Melhoria',
    status TEXT DEFAULT 'Planejado',
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.action_plan_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_plan_id UUID NOT NULL,
    what_action TEXT NOT NULL, -- What
    why_reason TEXT, -- Why
    where_location TEXT, -- Where
    when_deadline DATE, -- When
    who_responsible_user_id UUID, -- Who
    how_method TEXT, -- How
    how_much_cost NUMERIC, -- How Much
    status TEXT DEFAULT 'Pendente',
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Non-Conformities
CREATE TABLE public.non_conformities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    nc_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    severity TEXT NOT NULL, -- Baixa, Média, Alta, Crítica
    source TEXT, -- Auditoria Interna, Cliente, Fornecedor, Processo
    detected_date DATE NOT NULL,
    detected_by_user_id UUID,
    responsible_user_id UUID,
    status TEXT DEFAULT 'Aberta',
    root_cause_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.corrective_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    non_conformity_id UUID NOT NULL,
    action_description TEXT NOT NULL,
    responsible_user_id UUID,
    due_date DATE,
    completion_date DATE,
    status TEXT DEFAULT 'Planejada',
    effectiveness_verification TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Base
CREATE TABLE public.knowledge_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    author_user_id UUID NOT NULL,
    status TEXT DEFAULT 'Rascunho',
    version INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suppliers Management
CREATE TABLE public.suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    cnpj TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    category TEXT,
    status TEXT DEFAULT 'Ativo',
    qualification_status TEXT DEFAULT 'Não Qualificado',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    evaluation_date DATE NOT NULL,
    quality_score NUMERIC(3,2),
    delivery_score NUMERIC(3,2),
    service_score NUMERIC(3,2),
    overall_score NUMERIC(3,2),
    comments TEXT,
    evaluator_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsc_perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsc_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their company strategic maps" ON public.strategic_maps
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage perspectives from their company maps" ON public.bsc_perspectives
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.strategic_maps 
        WHERE strategic_maps.id = bsc_perspectives.strategic_map_id 
        AND strategic_maps.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage objectives from their company perspectives" ON public.bsc_objectives
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.bsc_perspectives bp
        JOIN public.strategic_maps sm ON bp.strategic_map_id = sm.id
        WHERE bp.id = bsc_objectives.perspective_id 
        AND sm.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company process maps" ON public.process_maps
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage activities from their company processes" ON public.process_activities
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.process_maps 
        WHERE process_maps.id = process_activities.process_map_id 
        AND process_maps.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company risk matrices" ON public.risk_matrices
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage risk assessments from their company matrices" ON public.risk_assessments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.risk_matrices 
        WHERE risk_matrices.id = risk_assessments.risk_matrix_id 
        AND risk_matrices.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage risk treatments from their company assessments" ON public.risk_treatments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.risk_assessments ra
        JOIN public.risk_matrices rm ON ra.risk_matrix_id = rm.id
        WHERE ra.id = risk_treatments.risk_assessment_id 
        AND rm.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company action plans" ON public.action_plans
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage items from their company action plans" ON public.action_plan_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.action_plans 
        WHERE action_plans.id = action_plan_items.action_plan_id 
        AND action_plans.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company non-conformities" ON public.non_conformities
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage corrective actions from their company NCs" ON public.corrective_actions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.non_conformities 
        WHERE non_conformities.id = corrective_actions.non_conformity_id 
        AND non_conformities.company_id = get_user_company_id()
    ));

CREATE POLICY "Users can manage their company knowledge articles" ON public.knowledge_articles
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company suppliers" ON public.suppliers
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage evaluations from their company suppliers" ON public.supplier_evaluations
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE suppliers.id = supplier_evaluations.supplier_id 
        AND suppliers.company_id = get_user_company_id()
    ));

-- Triggers for updated_at
CREATE TRIGGER update_strategic_maps_updated_at
    BEFORE UPDATE ON public.strategic_maps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bsc_objectives_updated_at
    BEFORE UPDATE ON public.bsc_objectives
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_process_maps_updated_at
    BEFORE UPDATE ON public.process_maps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_matrices_updated_at
    BEFORE UPDATE ON public.risk_matrices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at
    BEFORE UPDATE ON public.risk_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_treatments_updated_at
    BEFORE UPDATE ON public.risk_treatments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at
    BEFORE UPDATE ON public.action_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_plan_items_updated_at
    BEFORE UPDATE ON public.action_plan_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_non_conformities_updated_at
    BEFORE UPDATE ON public.non_conformities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corrective_actions_updated_at
    BEFORE UPDATE ON public.corrective_actions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();