-- Add employee_id column to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_employee ON public.form_submissions(employee_id);

-- Comment for documentation
COMMENT ON COLUMN public.form_submissions.employee_id IS 'Optional reference to link form submission to an employee';