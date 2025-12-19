-- Remover constraint global atual
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_code_key;

-- Criar nova constraint composta (company_id + employee_code)
-- Isso permite que diferentes empresas tenham o mesmo employee_code
ALTER TABLE employees ADD CONSTRAINT employees_company_employee_code_key 
  UNIQUE (company_id, employee_code);