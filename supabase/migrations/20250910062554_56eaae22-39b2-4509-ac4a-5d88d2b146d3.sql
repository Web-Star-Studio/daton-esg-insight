-- Create compliance module tables

-- Create enum for task status
CREATE TYPE compliance_task_status_enum AS ENUM (
    'Pendente',
    'Em Andamento', 
    'Concluído',
    'Em Atraso'
);

-- Create enum for jurisdiction
CREATE TYPE jurisdiction_enum AS ENUM (
    'Federal',
    'Estadual',
    'Municipal'
);

-- Create enum for frequency
CREATE TYPE frequency_enum AS ENUM (
    'Única',
    'Anual',
    'Semestral',
    'Trimestral',
    'Mensal',
    'Sob Demanda'
);

-- Create regulatory_requirements table
CREATE TABLE public.regulatory_requirements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    reference_code TEXT,
    jurisdiction jurisdiction_enum NOT NULL DEFAULT 'Federal',
    summary TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance_tasks table
CREATE TABLE public.compliance_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    requirement_id UUID REFERENCES public.regulatory_requirements(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency frequency_enum NOT NULL DEFAULT 'Anual',
    due_date DATE NOT NULL,
    status compliance_task_status_enum NOT NULL DEFAULT 'Pendente',
    responsible_user_id UUID,
    evidence_document_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for regulatory_requirements
CREATE POLICY "Users can manage their company regulatory requirements" 
ON public.regulatory_requirements 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for compliance_tasks
CREATE POLICY "Users can manage their company compliance tasks" 
ON public.compliance_tasks 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create triggers for updated_at
CREATE TRIGGER update_regulatory_requirements_updated_at
    BEFORE UPDATE ON public.regulatory_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_tasks_updated_at
    BEFORE UPDATE ON public.compliance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_regulatory_requirements_company_id ON public.regulatory_requirements(company_id);
CREATE INDEX idx_compliance_tasks_company_id ON public.compliance_tasks(company_id);
CREATE INDEX idx_compliance_tasks_due_date ON public.compliance_tasks(due_date);
CREATE INDEX idx_compliance_tasks_status ON public.compliance_tasks(status);
CREATE INDEX idx_compliance_tasks_responsible ON public.compliance_tasks(responsible_user_id);