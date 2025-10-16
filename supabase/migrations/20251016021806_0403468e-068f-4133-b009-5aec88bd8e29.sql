-- Remove a constraint que impede múltiplos relatórios GRI por ano
ALTER TABLE public.gri_reports DROP CONSTRAINT IF EXISTS gri_reports_company_id_year_key;