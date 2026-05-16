-- Wave 2 do cleanup de SECURITY DEFINER functions. Esta migration revoga
-- EXECUTE de anon/authenticated em 35 trigger functions identificadas via:
--
--   SELECT DISTINCT p.proname FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   JOIN pg_trigger t ON t.tgfoid = p.oid
--   WHERE n.nspname='public' AND p.prosecdef=true AND NOT t.tgisinternal;
--
-- Triggers em Postgres não precisam de EXECUTE do role do caller — eles
-- rodam automaticamente no contexto do DML (INSERT/UPDATE/DELETE) e, sendo
-- SECURITY DEFINER, executam como owner (postgres). REVOKE pra
-- anon/authenticated não afeta nada, só fecha vetor de chamada direta via
-- supabase.rpc() — todas verificadas via grep como NÃO chamadas no
-- app/edge code.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.assert_training_efficacy_evaluation_program_match() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_queue_timeout_retry() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_goal_progress_percentage() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_legislation_alert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_overall_applicability() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_automatic_alerts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_document_version() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_legislation_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_nc_timeline_entry() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_document_deletion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_permission_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_setting_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_cnpj_before_save() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_legislation_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_unit_compliance_issues() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_assessment_company_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_career_plan_company_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_employee_training_defaults() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_framework_company_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_job_started_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_mentoring_relationship_company_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_stakeholder_company_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_training_program_defaults() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ai_performance_metrics() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_available_quantity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_measurement_deviation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_platform_admin_last_login() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_project_progress() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_risk_level() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_session_progress() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_supplier_failure_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_supplier_failure_count_v3() FROM anon, authenticated;

COMMIT;
