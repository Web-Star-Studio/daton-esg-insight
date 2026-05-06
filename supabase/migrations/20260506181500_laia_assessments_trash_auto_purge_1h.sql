-- Auto-purge soft-deleted laia_assessments older than 1 hour.
-- Runs every 5 minutes via pg_cron, so worst-case retention is ~1h05m.
-- Window length matches the recovery time the team is comfortable with;
-- adjust the `interval '1 hour'` here and the UI copy together.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_laia_assessments_trash()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH deleted AS (
    DELETE FROM public.laia_assessments
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '1 hour'
    RETURNING 1
  )
  SELECT COUNT(*)::INT FROM deleted;
$function$;

DO $$
BEGIN
  PERFORM cron.unschedule('purge_laia_assessments_trash');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'purge_laia_assessments_trash',
  '*/5 * * * *',
  $$SELECT public.purge_laia_assessments_trash();$$
);
