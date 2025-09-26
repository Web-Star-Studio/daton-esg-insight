-- Create career development plans table (PDIs)
CREATE TABLE public.career_development_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  current_position TEXT NOT NULL,
  target_position TEXT NOT NULL,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Andamento',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  mentor_id UUID,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_to_develop JSONB NOT NULL DEFAULT '[]'::jsonb,
  development_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create succession plans table
CREATE TABLE public.succession_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  position_title TEXT NOT NULL,
  department TEXT NOT NULL,
  current_holder_id UUID,
  critical_level TEXT NOT NULL DEFAULT 'Médio',
  expected_retirement_date DATE,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create succession candidates table
CREATE TABLE public.succession_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  succession_plan_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  readiness_level TEXT NOT NULL DEFAULT 'Pronto em 12 meses',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  development_needs JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentoring relationships table
CREATE TABLE public.mentoring_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  program_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'Ativo',
  objectives JSONB DEFAULT '[]'::jsonb,
  meeting_frequency TEXT DEFAULT 'Quinzenal',
  progress_notes TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competency matrix table
CREATE TABLE public.competency_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  competency_name TEXT NOT NULL,
  competency_category TEXT NOT NULL,
  description TEXT,
  levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee competency assessments table
CREATE TABLE public.employee_competency_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  competency_id UUID NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  target_level INTEGER NOT NULL DEFAULT 1,
  assessment_date DATE NOT NULL,
  assessor_user_id UUID,
  development_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internal job postings table
CREATE TABLE public.internal_job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT,
  employment_type TEXT NOT NULL DEFAULT 'Efetivo',
  level TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  application_deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto',
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_posting_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  cover_letter TEXT,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.career_development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their company career development plans" 
ON public.career_development_plans 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company succession plans" 
ON public.succession_plans 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage succession candidates from their company plans" 
ON public.succession_candidates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.succession_plans 
  WHERE id = succession_candidates.succession_plan_id 
  AND company_id = get_user_company_id()
));

CREATE POLICY "Users can manage their company mentoring relationships" 
ON public.mentoring_relationships 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company competency matrix" 
ON public.competency_matrix 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage competency assessments from their company" 
ON public.employee_competency_assessments 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company job postings" 
ON public.internal_job_postings 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage applications from their company postings" 
ON public.job_applications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.internal_job_postings 
  WHERE id = job_applications.job_posting_id 
  AND company_id = get_user_company_id()
));

-- Create foreign key constraints
ALTER TABLE public.career_development_plans
ADD CONSTRAINT fk_cdp_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.career_development_plans
ADD CONSTRAINT fk_cdp_mentor FOREIGN KEY (mentor_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.succession_plans
ADD CONSTRAINT fk_sp_current_holder FOREIGN KEY (current_holder_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.succession_candidates
ADD CONSTRAINT fk_sc_succession_plan FOREIGN KEY (succession_plan_id) REFERENCES public.succession_plans(id) ON DELETE CASCADE;

ALTER TABLE public.succession_candidates
ADD CONSTRAINT fk_sc_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.mentoring_relationships
ADD CONSTRAINT fk_mr_mentor FOREIGN KEY (mentor_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.mentoring_relationships
ADD CONSTRAINT fk_mr_mentee FOREIGN KEY (mentee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_competency_assessments
ADD CONSTRAINT fk_eca_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_competency_assessments
ADD CONSTRAINT fk_eca_competency FOREIGN KEY (competency_id) REFERENCES public.competency_matrix(id) ON DELETE CASCADE;

ALTER TABLE public.employee_competency_assessments
ADD CONSTRAINT fk_eca_assessor FOREIGN KEY (assessor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.job_applications
ADD CONSTRAINT fk_ja_job_posting FOREIGN KEY (job_posting_id) REFERENCES public.internal_job_postings(id) ON DELETE CASCADE;

ALTER TABLE public.job_applications
ADD CONSTRAINT fk_ja_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Create updated_at triggers
CREATE TRIGGER update_career_development_plans_updated_at
BEFORE UPDATE ON public.career_development_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_plans_updated_at
BEFORE UPDATE ON public.succession_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_candidates_updated_at
BEFORE UPDATE ON public.succession_candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentoring_relationships_updated_at
BEFORE UPDATE ON public.mentoring_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competency_matrix_updated_at
BEFORE UPDATE ON public.competency_matrix
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_competency_assessments_updated_at
BEFORE UPDATE ON public.employee_competency_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_job_postings_updated_at
BEFORE UPDATE ON public.internal_job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraints
ALTER TABLE public.mentoring_relationships
ADD CONSTRAINT unique_active_mentoring UNIQUE (mentor_id, mentee_id, status)
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.job_applications
ADD CONSTRAINT unique_employee_job_application UNIQUE (job_posting_id, employee_id);

ALTER TABLE public.employee_competency_assessments
ADD CONSTRAINT unique_employee_competency UNIQUE (employee_id, competency_id, assessment_date);