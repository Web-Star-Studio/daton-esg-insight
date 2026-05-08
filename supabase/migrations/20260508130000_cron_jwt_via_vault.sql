-- Move JWT do cron `compliance-update-letter-monthly` para o `vault`.
-- A migration original (20260507120000) tinha o JWT inline no SQL, indo
-- pra git e sem dar para rotacionar sem nova migration. Esta correção:
--
--   1) Cria o secret `cron_invoke_jwt` no vault com o anon key atual.
--   2) Reagenda o cron lendo o secret em runtime via vault.decrypted_secrets.
--
-- IMPORTANTE: após mergear esta migration, ROTACIONAR o anon key no
-- dashboard do Supabase (o JWT antigo está no histórico do git da branch
-- atual). O fluxo completo de rotação:
--
--   1. Dashboard → Settings → API → Reset anon key
--   2. SELECT vault.update_secret(
--        (SELECT id FROM vault.secrets WHERE name = 'cron_invoke_jwt'),
--        '<novo-anon-jwt>'
--      );
--   3. Atualizar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
--      no Lovable env e redeployar o front.

-- 1. Garante o secret. Idempotente: se já existir, não recria.
DO $$
DECLARE
  v_secret_id uuid;
BEGIN
  SELECT id INTO v_secret_id FROM vault.secrets WHERE name = 'cron_invoke_jwt';
  IF v_secret_id IS NULL THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbHZpb2lqcXpsdm52dmFqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzM1MzUsImV4cCI6MjA3MzA0OTUzNX0.tJdmq7Y5bMKdO1njvPR73W0wPwmUPyltsBM_oNCqDPQ',
      'cron_invoke_jwt',
      'JWT anon usado pelo pg_cron para invocar edge functions internas. Rotacionar junto com o anon key.'
    );
  END IF;
END $$;

-- 2. Reagenda o cron lendo do vault em runtime.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'compliance-update-letter-monthly'
  ) THEN
    PERFORM cron.unschedule('compliance-update-letter-monthly');
  END IF;
END $$;

SELECT cron.schedule(
  'compliance-update-letter-monthly',
  '0 6 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/compliance-update-letter-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_invoke_jwt' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('source', 'cron', 'timestamp', now())
  );
  $$
);
