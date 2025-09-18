-- Create PGRS Plans table
CREATE TABLE public.pgrs_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  plan_name VARCHAR NOT NULL,
  creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR NOT NULL DEFAULT 'Em Desenvolvimento',
  responsible_user_id UUID,
  version VARCHAR NOT NULL DEFAULT '1.0',
  approval_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PGRS Waste Sources table
CREATE TABLE public.pgrs_waste_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pgrs_plan_id UUID NOT NULL REFERENCES public.pgrs_plans(id) ON DELETE CASCADE,
  source_name VARCHAR NOT NULL,
  source_type VARCHAR NOT NULL,
  location VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PGRS Waste Types table
CREATE TABLE public.pgrs_waste_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.pgrs_waste_sources(id) ON DELETE CASCADE,
  waste_name VARCHAR NOT NULL,
  ibama_code VARCHAR,
  conama_code VARCHAR,
  hazard_class VARCHAR NOT NULL,
  composition TEXT,
  estimated_quantity_monthly NUMERIC NOT NULL DEFAULT 0,
  unit VARCHAR NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PGRS Procedures table
CREATE TABLE public.pgrs_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pgrs_plan_id UUID NOT NULL REFERENCES public.pgrs_plans(id) ON DELETE CASCADE,
  procedure_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  infrastructure_details TEXT,
  responsible_role VARCHAR,
  frequency VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PGRS Goals table
CREATE TABLE public.pgrs_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pgrs_plan_id UUID NOT NULL REFERENCES public.pgrs_plans(id) ON DELETE CASCADE,
  goal_type VARCHAR NOT NULL,
  waste_type_id UUID REFERENCES public.pgrs_waste_types(id),
  baseline_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit VARCHAR NOT NULL,
  deadline DATE NOT NULL,
  responsible_user_id UUID,
  status VARCHAR NOT NULL DEFAULT 'Em Andamento',
  progress_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PGRS Actions table
CREATE TABLE public.pgrs_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.pgrs_goals(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  responsible_user_id UUID,
  due_date DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'Pendente',
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Waste Suppliers table
CREATE TABLE public.waste_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  company_name VARCHAR NOT NULL,
  cnpj VARCHAR,
  supplier_type VARCHAR NOT NULL CHECK (supplier_type IN ('transporter', 'destination', 'both')),
  contact_name VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  address TEXT,
  license_number VARCHAR,
  license_type VARCHAR,
  license_expiry DATE,
  license_issuing_body VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'Ativo',
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pgrs_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgrs_waste_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgrs_waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgrs_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgrs_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgrs_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for PGRS Plans
CREATE POLICY "Users can manage their company PGRS plans" 
ON public.pgrs_plans 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for PGRS Waste Sources
CREATE POLICY "Users can manage waste sources from their company plans" 
ON public.pgrs_waste_sources 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pgrs_plans 
  WHERE pgrs_plans.id = pgrs_waste_sources.pgrs_plan_id 
  AND pgrs_plans.company_id = get_user_company_id()
));

-- Create RLS policies for PGRS Waste Types
CREATE POLICY "Users can manage waste types from their company sources" 
ON public.pgrs_waste_types 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pgrs_waste_sources 
  JOIN public.pgrs_plans ON pgrs_plans.id = pgrs_waste_sources.pgrs_plan_id
  WHERE pgrs_waste_sources.id = pgrs_waste_types.source_id 
  AND pgrs_plans.company_id = get_user_company_id()
));

-- Create RLS policies for PGRS Procedures
CREATE POLICY "Users can manage procedures from their company plans" 
ON public.pgrs_procedures 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pgrs_plans 
  WHERE pgrs_plans.id = pgrs_procedures.pgrs_plan_id 
  AND pgrs_plans.company_id = get_user_company_id()
));

-- Create RLS policies for PGRS Goals
CREATE POLICY "Users can manage goals from their company plans" 
ON public.pgrs_goals 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pgrs_plans 
  WHERE pgrs_plans.id = pgrs_goals.pgrs_plan_id 
  AND pgrs_plans.company_id = get_user_company_id()
));

-- Create RLS policies for PGRS Actions
CREATE POLICY "Users can manage actions from their company goals" 
ON public.pgrs_actions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pgrs_goals 
  JOIN public.pgrs_plans ON pgrs_plans.id = pgrs_goals.pgrs_plan_id
  WHERE pgrs_goals.id = pgrs_actions.goal_id 
  AND pgrs_plans.company_id = get_user_company_id()
));

-- Create RLS policies for Waste Suppliers
CREATE POLICY "Users can manage their company waste suppliers" 
ON public.waste_suppliers 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create triggers for updated_at columns
CREATE TRIGGER update_pgrs_plans_updated_at
  BEFORE UPDATE ON public.pgrs_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgrs_waste_sources_updated_at
  BEFORE UPDATE ON public.pgrs_waste_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgrs_waste_types_updated_at
  BEFORE UPDATE ON public.pgrs_waste_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgrs_procedures_updated_at
  BEFORE UPDATE ON public.pgrs_procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgrs_goals_updated_at
  BEFORE UPDATE ON public.pgrs_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pgrs_actions_updated_at
  BEFORE UPDATE ON public.pgrs_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waste_suppliers_updated_at
  BEFORE UPDATE ON public.waste_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_pgrs_plans_company_id ON public.pgrs_plans(company_id);
CREATE INDEX idx_pgrs_waste_sources_plan_id ON public.pgrs_waste_sources(pgrs_plan_id);
CREATE INDEX idx_pgrs_waste_types_source_id ON public.pgrs_waste_types(source_id);
CREATE INDEX idx_pgrs_procedures_plan_id ON public.pgrs_procedures(pgrs_plan_id);
CREATE INDEX idx_pgrs_goals_plan_id ON public.pgrs_goals(pgrs_plan_id);
CREATE INDEX idx_pgrs_actions_goal_id ON public.pgrs_actions(goal_id);
CREATE INDEX idx_waste_suppliers_company_id ON public.waste_suppliers(company_id);
CREATE INDEX idx_waste_suppliers_type ON public.waste_suppliers(supplier_type);
CREATE INDEX idx_waste_suppliers_status ON public.waste_suppliers(status);