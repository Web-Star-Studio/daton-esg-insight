
-- Remove legacy company-wide unique constraint on laia_sectors
ALTER TABLE public.laia_sectors DROP CONSTRAINT IF EXISTS laia_sectors_company_id_code_key;

-- Ensure branch-scoped unique constraint exists
CREATE UNIQUE INDEX IF NOT EXISTS laia_sectors_company_branch_code_unique
  ON public.laia_sectors (company_id, branch_id, code);
