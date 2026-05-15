-- Fixes de RLS cross-tenant identificados em
-- docs/audits/auditoria-bugs-2026-05-15.md
--
-- F-015 career_development_plans: policy "ALL com auth.role()='authenticated'"
--   permitia qualquer usuário autenticado SELECT/INSERT/UPDATE/DELETE em planos
--   de carreira de qualquer empresa. Substituída por policies escopadas por
--   company_id (via get_user_company_id()).
--
-- F-016 mentoring_relationships: mesmo padrão de F-015 (tabela ainda vazia,
--   mas a policy já estava aberta).
--
-- F-018 _laia_sectors_rename_audit_20260514: tabela de auditoria do backfill
--   de 14/mai/2026 (migration 20260514130000_backfill_laia_sector_names.sql)
--   estava sem RLS, com 306 linhas de 2 empresas publicamente legíveis.
--   Histórico preservado para eventual reversão, mas leitura restrita a
--   platform_admin. Sem write policies = ninguém escreve via API (a migration
--   original já populou via service_role).

BEGIN;

-- =============================================================================
-- F-015: career_development_plans
-- =============================================================================
DROP POLICY IF EXISTS "Enable all operations for authenticated users on career develop"
  ON public.career_development_plans;

CREATE POLICY "career_dev_plans_select_company"
  ON public.career_development_plans
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "career_dev_plans_insert_company"
  ON public.career_development_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "career_dev_plans_update_company"
  ON public.career_development_plans
  FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "career_dev_plans_delete_company"
  ON public.career_development_plans
  FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- =============================================================================
-- F-016: mentoring_relationships
-- =============================================================================
DROP POLICY IF EXISTS "Enable all operations for authenticated users on mentoring rela"
  ON public.mentoring_relationships;

CREATE POLICY "mentoring_rel_select_company"
  ON public.mentoring_relationships
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "mentoring_rel_insert_company"
  ON public.mentoring_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "mentoring_rel_update_company"
  ON public.mentoring_relationships
  FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "mentoring_rel_delete_company"
  ON public.mentoring_relationships
  FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- =============================================================================
-- F-018: _laia_sectors_rename_audit_20260514
-- =============================================================================
ALTER TABLE public._laia_sectors_rename_audit_20260514 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "laia_rename_audit_admin_only_select"
  ON public._laia_sectors_rename_audit_20260514
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

COMMIT;
