-- Wave 4 do cleanup de SECURITY DEFINER. Revoga EXECUTE de `anon` em
-- 23 RPCs que são chamadas pelo app via supabase.rpc() (precisam manter
-- EXECUTE para authenticated) mas que não fazem sentido para um usuário
-- não-autenticado chamar.
--
-- Cross-checked contra pg_policies em public+storage: nenhuma das 23
-- funções abaixo é referenciada em USING/WITH CHECK de qualquer policy.
-- (Funções que SÃO usadas em policies — has_role, is_platform_admin,
-- get_user_company_id, has_company_access, can_manage_user_modules,
-- user_has_permission — ficam intactas porque RLS pode disparar mesmo
-- para anon e precisa poder avaliar a função, mesmo que retorne false.)

BEGIN;

REVOKE EXECUTE ON FUNCTION public.calculate_audit_score(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_conservation_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_gri_report_completion(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_hierarchy_levels(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_indicator_statistics(uuid, date, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_risk_management_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_simple_emissions(numeric, text, numeric, numeric, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_supplier_mandatory_documents() FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_audit_planning(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_conversion_factor(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_conversion_factor(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_analytics(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_esg_financial_stats(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_indicator_suggested_value(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_indicator_suggested_value(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_laia_branch_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_laia_dashboard_stats(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_nc_dashboard_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_supplier_credentials(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_campaign_responded(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_glossary_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_activity(uuid, uuid, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_pending_retries() FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_across_tables(text, uuid, integer) FROM anon;

COMMIT;
