-- Cleanup parcial de SECURITY DEFINER functions com EXECUTE aberto a
-- anon/authenticated sem necessidade (linter aponta 167 ocorrências do
-- tipo `anon_security_definer_function_executable` /
-- `authenticated_security_definer_function_executable`).
--
-- Esta onda 1 cobre só os casos mais claros e perigosos. Resto fica
-- para próximas ondas conforme cada função é validada caso a caso.
--
-- 1. DROP public.exec_sql(text) — função SECURITY DEFINER que executa
--    SELECT arbitrário com permissões de `postgres` (owner), bypassando
--    RLS. Tem validações regex mas pode ser bypassada (encoding, funções
--    PG como pg_read_file). Substituída por get_dashboard_analytics
--    (migration 20250927085710). Zero callers no app/edge — confirmado
--    via grep em src/ e supabase/functions/.
--
-- 2. REVOKE EXECUTE FROM anon, authenticated em 4 funções internas que
--    nunca são chamadas pelo client (verified via grep):
--    - check_job_timeouts(): cron job interno
--    - cleanup_old_activity_logs(): cron job interno
--    - cleanup_old_rate_limits(): cron job interno
--    - debug_auth_status(): debugging only, não deveria estar exposta
--    service_role e postgres mantêm acesso (não tocados).

BEGIN;

-- 1) Drop exec_sql
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- 2) REVOKE EXECUTE de funções claramente internas
REVOKE EXECUTE ON FUNCTION public.check_job_timeouts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_activity_logs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_auth_status() FROM anon, authenticated;

COMMIT;
