-- Move JWT do cron `compliance-update-letter-monthly` para o `vault`.
-- A migration original (20260507120000) tinha o JWT inline no SQL, indo
-- pra git. Esta correção troca pra leitura via vault.decrypted_secrets,
-- mas NÃO carrega o JWT no SQL — exige que o operador provisione o
-- secret out-of-band antes de aplicar.
--
-- ORDEM DE OPERAÇÃO (obrigatória):
--
--   1. No dashboard do Supabase (SQL Editor), provisionar o secret:
--
--        SELECT vault.create_secret(
--          '<novo-anon-jwt>',
--          'cron_invoke_jwt',
--          'JWT anon usado pelo pg_cron para invocar edge functions internas'
--        );
--
--      Se o anon key antigo já está comprometido (vazou no git), gere um
--      NOVO no Dashboard → Settings → API → Reset anon key ANTES de criar
--      o secret. Não reusar o JWT antigo.
--
--   2. Provisionar `CRON_INVOKE_JWT` no Edge Functions Secrets (mesmo
--      valor do vault). A função `compliance-update-letter-cron` valida
--      o header `Authorization: Bearer <jwt>` contra essa env var.
--
--   3. Atualizar env var do front (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
--      ou VITE_SUPABASE_PUBLISHABLE_KEY) com o novo anon key e redeployar.
--
--   4. Aplicar esta migration. Ela falha intencionalmente com EXCEPTION
--      se o secret não existir — protege contra rodar sem cumprir o
--      passo 1 e deixar o cron com `Authorization: Bearer ` (vazio).

-- 1. Pré-requisito: secret deve existir. Se não existir, falha com
--    instrução clara em vez de carregar JWT inline ou seguir silencioso.
DO $$
DECLARE
  v_secret_id uuid;
BEGIN
  SELECT id INTO v_secret_id FROM vault.secrets WHERE name = 'cron_invoke_jwt';
  IF v_secret_id IS NULL THEN
    RAISE EXCEPTION
      'vault secret "cron_invoke_jwt" não encontrado. Provisione manualmente antes de aplicar esta migration — ver cabeçalho do arquivo (ORDEM DE OPERAÇÃO passo 1).';
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
