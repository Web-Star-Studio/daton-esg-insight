-- Cron diário (09:00 BRT = 12:00 UTC) que dispara a edge function
-- `efficacy-evaluation-reminder`. A função envia e-mail aos avaliadores com
-- treinamentos cujos prazos de avaliação caem em 7, 3 ou 1 dia(s) ou já
-- estão atrasados. Mesmo padrão do agendamento de stakeholder reviews.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'efficacy-evaluation-email-reminder-daily'
  ) THEN
    PERFORM cron.unschedule('efficacy-evaluation-email-reminder-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'efficacy-evaluation-email-reminder-daily',
  '0 12 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/efficacy-evaluation-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbHZpb2lqcXpsdm52dmFqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzM1MzUsImV4cCI6MjA3MzA0OTUzNX0.tJdmq7Y5bMKdO1njvPR73W0wPwmUPyltsBM_oNCqDPQ"}'::jsonb,
      body:=jsonb_build_object('source', 'cron', 'timestamp', now())
    ) AS request_id;
  $$
);
