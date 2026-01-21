-- Add CPF column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Create unique index on CPF per company (allowing NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS employees_cpf_company_unique 
ON public.employees (company_id, cpf) 
WHERE cpf IS NOT NULL;

-- Make employee_code nullable (optional now that CPF can be used as identifier)
ALTER TABLE public.employees
ALTER COLUMN employee_code DROP NOT NULL;