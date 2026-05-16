-- Wave 3 do cleanup de SECURITY DEFINER. Revoga EXECUTE de
-- anon/authenticated em 13 funções que NÃO são triggers (já cobertos
-- na wave 2), NÃO são chamadas via .rpc() no app/edge (verificadas
-- via grep) e NÃO são usadas em policies RLS (verificadas via pg_policies).
--
-- service_role e postgres mantêm acesso — cron jobs e operações
-- administrativas continuam funcionando. Edge functions usam
-- service_role e não são afetadas.
--
-- Mantidas (USED em policies RLS — fora desta migration):
--   has_company_access(uuid)        — usada em activity_logs, branches,
--                                     departments, employees, positions
--   user_has_permission(...)        — usada em permission_audit_log,
--                                     user_custom_permissions
--   can_manage_user_modules(uuid)   — usada em user_module_access

BEGIN;

REVOKE EXECUTE ON FUNCTION public.calculate_bsc_objective_progress(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_indicator_deviation(numeric, numeric, numeric, numeric, numeric, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_license_status(date, date, license_status_enum) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_risk_level(character varying, character varying) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_field_mapping_usage(uuid, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, uuid, text, text, uuid, jsonb, jsonb, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_platform_admin_action(text, uuid, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_laia_assessments_trash() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_job_for_retry(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_nc_overdue_tasks() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_overdue_tasks() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_company_access(uuid) FROM anon, authenticated;

COMMIT;
