-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule auto-generation of alerts to run daily at 8 AM
SELECT cron.schedule(
  'auto-generate-license-alerts',
  '0 8 * * *', -- Every day at 8 AM
  $$
  SELECT
    net.http_post(
      url:='https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/auto-generate-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbHZpb2lqcXpsdm52dmFqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzM1MzUsImV4cCI6MjA3MzA0OTUzNX0.tJdmq7Y5bMKdO1njvPR73W0wPwmUPyltsBM_oNCqDPQ"}'::jsonb,
      body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('auto-generate-license-alerts');