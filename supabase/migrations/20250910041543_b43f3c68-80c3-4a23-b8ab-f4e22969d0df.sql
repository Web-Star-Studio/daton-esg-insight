-- Create ENUMs for generated reports
CREATE TYPE public.report_template_enum AS ENUM (
    'GHG_PROTOCOL',
    'GRI_STANDARD', 
    'GOALS_PERFORMANCE',
    'CUSTOM_REPORT'
);

CREATE TYPE public.report_status_enum AS ENUM (
    'Rascunho',
    'Gerando',
    'Concluído'
);

-- Create generated_reports table
CREATE TABLE public.generated_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title CHARACTER VARYING NOT NULL,
    report_template report_template_enum NOT NULL,
    data_period_start DATE NOT NULL,
    data_period_end DATE NOT NULL,
    generation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status report_status_enum NOT NULL DEFAULT 'Rascunho',
    config_json JSONB,
    file_path_pdf CHARACTER VARYING,
    file_path_xlsx CHARACTER VARYING,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their company generated reports"
ON public.generated_reports
FOR ALL
USING (company_id = get_user_company_id());

-- Create updated_at trigger
CREATE TRIGGER update_generated_reports_updated_at
    BEFORE UPDATE ON public.generated_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_generated_reports_company_id ON public.generated_reports(company_id);
CREATE INDEX idx_generated_reports_user_id ON public.generated_reports(user_id);
CREATE INDEX idx_generated_reports_status ON public.generated_reports(status);
CREATE INDEX idx_generated_reports_generation_date ON public.generated_reports(generation_date DESC);