-- Create table for employee benefits
CREATE TABLE public.employee_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  monthly_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  eligibility_rules TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  provider TEXT,
  contract_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company benefits" 
ON public.employee_benefits 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create benefits for their company" 
ON public.employee_benefits 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their company benefits" 
ON public.employee_benefits 
FOR UPDATE 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company benefits" 
ON public.employee_benefits 
FOR DELETE 
USING (company_id = get_user_company_id());

-- Create table for benefit enrollments
CREATE TABLE public.benefit_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  benefit_id UUID NOT NULL REFERENCES public.employee_benefits(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for enrollments
ALTER TABLE public.benefit_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for enrollments
CREATE POLICY "Users can view their company benefit enrollments" 
ON public.benefit_enrollments 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create enrollments for their company" 
ON public.benefit_enrollments 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their company enrollments" 
ON public.benefit_enrollments 
FOR UPDATE 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company enrollments" 
ON public.benefit_enrollments 
FOR DELETE 
USING (company_id = get_user_company_id());

-- Create triggers for updated_at
CREATE TRIGGER update_employee_benefits_updated_at
  BEFORE UPDATE ON public.employee_benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_benefit_enrollments_updated_at
  BEFORE UPDATE ON public.benefit_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();