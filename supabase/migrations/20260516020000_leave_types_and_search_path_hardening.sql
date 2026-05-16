-- Endereça F-024 e linter "function_search_path_mutable" da auditoria revisada
-- (Lovable, 2026-05-16 01:34 UTC).
--
-- F-024 leave_types: SELECT policy "Users can view all leave types" tinha
-- USING (true) para o role public, vazando configuração de tipos de licença
-- (RH) entre empresas. Substituída por SELECT escopada por company_id.
-- A policy ALL "Users can manage their company leave types" (já company-scoped)
-- continua intacta.
--
-- 5 trigger/utility functions estavam com search_path mutável — vetor de
-- search_path injection se um schema malicioso for prependido. Adicionado
-- SET search_path = public, pg_temp em todas. Não muda comportamento, apenas
-- fixa o resolver de identificadores.

BEGIN;

-- =============================================================================
-- F-024: leave_types — fechar SELECT cross-tenant
-- =============================================================================
DROP POLICY IF EXISTS "Users can view all leave types" ON public.leave_types;

CREATE POLICY "leave_types_select_company"
  ON public.leave_types
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- =============================================================================
-- function_search_path_mutable: 5 funções
-- =============================================================================
ALTER FUNCTION public.set_training_program_defaults() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_employee_training_defaults() SET search_path = public, pg_temp;
ALTER FUNCTION public.compute_route_pattern(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.estimate_user_pageview_seconds(uuid, timestamptz) SET search_path = public, pg_temp;
ALTER FUNCTION public.estimate_route_pageview_seconds(uuid, timestamptz) SET search_path = public, pg_temp;

COMMIT;
