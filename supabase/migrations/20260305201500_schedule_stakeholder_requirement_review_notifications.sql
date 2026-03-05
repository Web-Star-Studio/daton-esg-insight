CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'stakeholder-requirement-review-alerts-daily'
  ) THEN
    PERFORM cron.unschedule('stakeholder-requirement-review-alerts-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'stakeholder-requirement-review-alerts-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/smart-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbHZpb2lqcXpsdm52dmFqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzM1MzUsImV4cCI6MjA3MzA0OTUzNX0.tJdmq7Y5bMKdO1njvPR73W0wPwmUPyltsBM_oNCqDPQ"}'::jsonb,
      body:=jsonb_build_object(
        'action', 'check_stakeholder_requirement_reviews',
        'timestamp', now()
      )
    ) as request_id;
  $$
);
