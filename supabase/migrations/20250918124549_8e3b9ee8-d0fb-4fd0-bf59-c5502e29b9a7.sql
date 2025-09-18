-- PGRS Master Plans
CREATE TABLE public.pgrs_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    plan_name TEXT NOT NULL,
    creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Rascunho',
    responsible_user_id UUID,
    version TEXT DEFAULT '1.0',
    approval_date DATE,
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their company PGRS plans" 
ON public.pgrs_plans 
FOR ALL 
USING (company_id = get_user_company_id());

-- Waste Sources (Fontes Geradoras)
CREATE TABLE public.pgrs_waste_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pgrs_plan_id UUID NOT NULL,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'Restaurante', 'Escritório', 'Produção', etc
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_waste_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage waste sources from their company PGRS plans" 
ON public.pgrs_waste_sources 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.pgrs_plans 
    WHERE pgrs_plans.id = pgrs_waste_sources.pgrs_plan_id 
    AND pgrs_plans.company_id = get_user_company_id()
));

-- Waste Types per Source
CREATE TABLE public.pgrs_waste_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID NOT NULL,
    waste_name TEXT NOT NULL,
    ibama_code TEXT,
    conama_code TEXT,
    hazard_class TEXT NOT NULL, -- 'Classe I', 'Classe II A', 'Classe II B'
    composition TEXT,
    estimated_quantity_monthly NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_waste_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage waste types from their company sources" 
ON public.pgrs_waste_types 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.pgrs_waste_sources pws 
    JOIN public.pgrs_plans pp ON pws.pgrs_plan_id = pp.id
    WHERE pws.id = pgrs_waste_types.source_id 
    AND pp.company_id = get_user_company_id()
));

-- PGRS Procedures
CREATE TABLE public.pgrs_procedures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pgrs_plan_id UUID NOT NULL,
    procedure_type TEXT NOT NULL, -- 'segregation', 'internal_storage', 'external_storage', 'collection', 'transport'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    infrastructure_details TEXT,
    responsible_role TEXT,
    frequency TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_procedures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage procedures from their company PGRS plans" 
ON public.pgrs_procedures 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.pgrs_plans 
    WHERE pgrs_plans.id = pgrs_procedures.pgrs_plan_id 
    AND pgrs_plans.company_id = get_user_company_id()
));

-- PGRS Specific Goals (extends existing goals table concept)
CREATE TABLE public.pgrs_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pgrs_plan_id UUID NOT NULL,
    goal_type TEXT NOT NULL, -- 'reduction', 'recycling', 'reuse', 'cost_reduction'
    waste_type_id UUID, -- optional, for waste-specific goals
    baseline_value NUMERIC NOT NULL DEFAULT 0,
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    deadline DATE NOT NULL,
    responsible_user_id UUID,
    status TEXT DEFAULT 'Ativa',
    progress_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage goals from their company PGRS plans" 
ON public.pgrs_goals 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.pgrs_plans 
    WHERE pgrs_plans.id = pgrs_goals.pgrs_plan_id 
    AND pgrs_plans.company_id = get_user_company_id()
));

-- Actions for Goals
CREATE TABLE public.pgrs_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL,
    action_description TEXT NOT NULL,
    responsible_user_id UUID,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendente', -- 'Pendente', 'Em Andamento', 'Concluída', 'Atrasada'
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pgrs_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage actions from their company PGRS goals" 
ON public.pgrs_actions 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.pgrs_goals pg
    JOIN public.pgrs_plans pp ON pg.pgrs_plan_id = pp.id
    WHERE pg.id = pgrs_actions.goal_id 
    AND pp.company_id = get_user_company_id()
));

-- Waste Suppliers Management
CREATE TABLE public.waste_suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    supplier_type TEXT NOT NULL, -- 'transporter', 'destination', 'both'
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    license_number TEXT,
    license_type TEXT,
    license_expiry DATE,
    license_issuing_body TEXT,
    status TEXT DEFAULT 'Ativo',
    rating NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waste_suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their company waste suppliers" 
ON public.waste_suppliers 
FOR ALL 
USING (company_id = get_user_company_id());

-- MTR Documents (extends existing waste_logs)
CREATE TABLE public.mtr_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    waste_log_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    extracted_data JSONB DEFAULT '{}',
    validation_status TEXT DEFAULT 'Pendente', -- 'Pendente', 'Validado', 'Rejeitado'
    confidence_score NUMERIC DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    validated_by_user_id UUID,
    validation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mtr_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage MTR documents from their company waste logs" 
ON public.mtr_documents 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.waste_logs 
    WHERE waste_logs.id = mtr_documents.waste_log_id 
    AND waste_logs.company_id = get_user_company_id()
));

-- Add triggers for updated_at
CREATE TRIGGER update_pgrs_plans_updated_at BEFORE UPDATE ON public.pgrs_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pgrs_waste_sources_updated_at BEFORE UPDATE ON public.pgrs_waste_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pgrs_waste_types_updated_at BEFORE UPDATE ON public.pgrs_waste_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pgrs_procedures_updated_at BEFORE UPDATE ON public.pgrs_procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pgrs_goals_updated_at BEFORE UPDATE ON public.pgrs_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pgrs_actions_updated_at BEFORE UPDATE ON public.pgrs_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waste_suppliers_updated_at BEFORE UPDATE ON public.waste_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Foreign key constraints
ALTER TABLE public.pgrs_waste_sources ADD CONSTRAINT fk_pgrs_waste_sources_plan FOREIGN KEY (pgrs_plan_id) REFERENCES public.pgrs_plans(id) ON DELETE CASCADE;
ALTER TABLE public.pgrs_waste_types ADD CONSTRAINT fk_pgrs_waste_types_source FOREIGN KEY (source_id) REFERENCES public.pgrs_waste_sources(id) ON DELETE CASCADE;
ALTER TABLE public.pgrs_procedures ADD CONSTRAINT fk_pgrs_procedures_plan FOREIGN KEY (pgrs_plan_id) REFERENCES public.pgrs_plans(id) ON DELETE CASCADE;
ALTER TABLE public.pgrs_goals ADD CONSTRAINT fk_pgrs_goals_plan FOREIGN KEY (pgrs_plan_id) REFERENCES public.pgrs_plans(id) ON DELETE CASCADE;
ALTER TABLE public.pgrs_goals ADD CONSTRAINT fk_pgrs_goals_waste_type FOREIGN KEY (waste_type_id) REFERENCES public.pgrs_waste_types(id) ON DELETE SET NULL;
ALTER TABLE public.pgrs_actions ADD CONSTRAINT fk_pgrs_actions_goal FOREIGN KEY (goal_id) REFERENCES public.pgrs_goals(id) ON DELETE CASCADE;
ALTER TABLE public.mtr_documents ADD CONSTRAINT fk_mtr_documents_waste_log FOREIGN KEY (waste_log_id) REFERENCES public.waste_logs(id) ON DELETE CASCADE;