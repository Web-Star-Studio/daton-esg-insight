-- Create ESG Metrics table for Social and Governance data
CREATE TABLE public.esg_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL, -- Ex: "employee_turnover_rate", "board_diversity_percent"
    value NUMERIC NOT NULL,
    unit TEXT, -- Ex: "%", "horas", "índice"
    period DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.esg_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their company ESG metrics
CREATE POLICY "Users can manage their company esg metrics" 
ON public.esg_metrics 
FOR ALL 
USING (company_id = get_user_company_id());

-- Add trigger for updated_at
CREATE TRIGGER update_esg_metrics_updated_at
BEFORE UPDATE ON public.esg_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample social metrics data
INSERT INTO public.esg_metrics (company_id, metric_key, value, unit, period) 
SELECT 
    c.id,
    'employee_turnover_rate',
    12.0,
    '%',
    CURRENT_DATE - INTERVAL '1 month'
FROM public.companies c
LIMIT 1;

INSERT INTO public.esg_metrics (company_id, metric_key, value, unit, period)
SELECT 
    c.id,
    'training_hours_per_employee', 
    24.0,
    'horas',
    CURRENT_DATE - INTERVAL '1 month'
FROM public.companies c
LIMIT 1;

INSERT INTO public.esg_metrics (company_id, metric_key, value, unit, period)
SELECT 
    c.id,
    'diversity_index',
    6.8,
    'índice',
    CURRENT_DATE - INTERVAL '1 month'
FROM public.companies c
LIMIT 1;

-- Insert sample governance metrics data
INSERT INTO public.esg_metrics (company_id, metric_key, value, unit, period)
SELECT 
    c.id,
    'policy_compliance_rate',
    95.0,
    '%',
    CURRENT_DATE - INTERVAL '1 month'
FROM public.companies c
LIMIT 1;

INSERT INTO public.esg_metrics (company_id, metric_key, value, unit, period)
SELECT 
    c.id,
    'board_diversity_percent',
    40.0,
    '%',
    CURRENT_DATE - INTERVAL '1 month'
FROM public.companies c
LIMIT 1;