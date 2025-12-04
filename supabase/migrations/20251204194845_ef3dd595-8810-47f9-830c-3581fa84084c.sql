-- Remover foreign keys duplicadas da tabela career_development_plans
-- Manter apenas as FKs padrão (career_development_plans_employee_id_fkey e career_development_plans_mentor_id_fkey)

ALTER TABLE public.career_development_plans 
  DROP CONSTRAINT IF EXISTS fk_cdp_employee;

ALTER TABLE public.career_development_plans 
  DROP CONSTRAINT IF EXISTS fk_cdp_mentor;