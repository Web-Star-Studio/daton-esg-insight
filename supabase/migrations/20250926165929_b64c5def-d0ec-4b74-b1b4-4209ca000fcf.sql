-- Create performance evaluation cycles table
CREATE TABLE public.performance_evaluation_cycles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    evaluation_type VARCHAR(50) NOT NULL DEFAULT 'annual',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance evaluations table
CREATE TABLE public.performance_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    cycle_id UUID REFERENCES public.performance_evaluation_cycles(id),
    employee_id UUID NOT NULL,
    evaluator_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_score NUMERIC(3,2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    self_evaluation_completed BOOLEAN DEFAULT false,
    manager_evaluation_completed BOOLEAN DEFAULT false,
    final_review_completed BOOLEAN DEFAULT false,
    comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    development_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluation criteria table
CREATE TABLE public.evaluation_criteria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    max_score INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluation scores table
CREATE TABLE public.evaluation_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id),
    criteria_id UUID NOT NULL REFERENCES public.evaluation_criteria(id),
    self_score INTEGER,
    manager_score INTEGER,
    final_score INTEGER,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.performance_evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_evaluation_cycles
CREATE POLICY "Users can manage their company evaluation cycles"
ON public.performance_evaluation_cycles
FOR ALL
USING (company_id = get_user_company_id());

-- Create RLS policies for performance_evaluations
CREATE POLICY "Users can manage their company evaluations"
ON public.performance_evaluations
FOR ALL
USING (company_id = get_user_company_id());

-- Create RLS policies for evaluation_criteria
CREATE POLICY "Users can manage their company evaluation criteria"
ON public.evaluation_criteria
FOR ALL
USING (company_id = get_user_company_id());

-- Create RLS policies for evaluation_scores
CREATE POLICY "Users can manage scores from their company evaluations"
ON public.evaluation_scores
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.performance_evaluations 
    WHERE performance_evaluations.id = evaluation_scores.evaluation_id 
    AND performance_evaluations.company_id = get_user_company_id()
));

-- Create triggers for updated_at
CREATE TRIGGER update_performance_evaluation_cycles_updated_at
    BEFORE UPDATE ON public.performance_evaluation_cycles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_evaluations_updated_at
    BEFORE UPDATE ON public.performance_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();