-- Retenção das tabelas de tracking. Sem isso, `page_view_logs` cresce
-- indefinidamente — em produção já é a tabela mais inserida (1 linha por
-- navegação, todos os usuários). `event_logs` também cresce, mas mais
-- devagar.
--
-- Política:
--   • page_view_logs   → 180 dias (granularidade não importa pra
--                        analytics histórico além disso).
--   • event_logs       → 365 dias (eventos de negócio são mais raros e
--                        têm valor histórico maior).
--   • ai_usage_logs    → sem retenção (volume baixo, custo financeiro é
--                        relevante de manter long-term para auditoria).

CREATE OR REPLACE FUNCTION public.cleanup_tracking_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pv_deleted integer;
  ev_deleted integer;
BEGIN
  DELETE FROM public.page_view_logs
  WHERE viewed_at < now() - interval '180 days';
  GET DIAGNOSTICS pv_deleted = ROW_COUNT;

  DELETE FROM public.event_logs
  WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS ev_deleted = ROW_COUNT;

  RAISE NOTICE 'cleanup_tracking_logs: removidas % page_view_logs, % event_logs',
    pv_deleted, ev_deleted;
END;
$$;

-- Agenda diária às 03:00 UTC (baixo tráfego). Usa pg_cron já habilitado
-- no projeto (visto em outras migrations: schedule_efficacy_evaluation_*,
-- auto-generate-license-alerts).
SELECT cron.schedule(
  'cleanup-tracking-logs-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_tracking_logs(); $$
);
