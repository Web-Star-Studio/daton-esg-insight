-- Create custom forms tables
CREATE TABLE public.custom_forms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    created_by_user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    structure_json JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.form_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL,
    submitted_by_user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    submission_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_forms
CREATE POLICY "Users can view their company forms" 
ON public.custom_forms 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create forms for their company" 
ON public.custom_forms 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND created_by_user_id = auth.uid());

CREATE POLICY "Users can update their company forms" 
ON public.custom_forms 
FOR UPDATE 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company forms" 
ON public.custom_forms 
FOR DELETE 
USING (company_id = get_user_company_id());

-- RLS Policies for form_submissions
CREATE POLICY "Users can view submissions from their company forms" 
ON public.form_submissions 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can submit to their company forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND submitted_by_user_id = auth.uid());

CREATE POLICY "Users can update their own submissions" 
ON public.form_submissions 
FOR UPDATE 
USING (company_id = get_user_company_id() AND submitted_by_user_id = auth.uid());

CREATE POLICY "Users can delete submissions from their company" 
ON public.form_submissions 
FOR DELETE 
USING (company_id = get_user_company_id());

-- Triggers for updated_at
CREATE TRIGGER update_custom_forms_updated_at
BEFORE UPDATE ON public.custom_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.form_submissions 
ADD CONSTRAINT form_submissions_form_id_fkey 
FOREIGN KEY (form_id) REFERENCES public.custom_forms(id) ON DELETE CASCADE;