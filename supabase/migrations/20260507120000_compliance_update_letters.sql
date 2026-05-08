-- Carta de Atualização Mensal de Compliance.
-- Snapshot persistido por (branch_id, reference_month) replicando o relatório
-- mensal SOGI: cinco buckets de mudança normativa (publicadas / alteradas /
-- revogadas / excluídas / incluídas por revisão) + sumário executivo IA.
-- Geração é disparada por:
--   1) usuário, via edge function `compliance-update-letter-generator`;
--   2) cron mensal abaixo, via `compliance-update-letter-cron`.
-- O upsert garante idempotência: regerar substitui o conteúdo da mesma
-- (branch, mês), preservando o id.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.compliance_update_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id  uuid NOT NULL REFERENCES public.branches(id)  ON DELETE CASCADE,
  reference_month date NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT compliance_update_letters_unique_branch_month
    UNIQUE (branch_id, reference_month),
  -- reference_month sempre cravada no dia 1 do mês para garantir unicidade
  CONSTRAINT compliance_update_letters_month_truncated
    CHECK (reference_month = date_trunc('month', reference_month)::date)
);

CREATE INDEX IF NOT EXISTS compliance_update_letters_company_idx
  ON public.compliance_update_letters (company_id, reference_month DESC);

-- Reusa a mesma function trigger usada pelas demais tabelas de legislação.
CREATE TRIGGER compliance_update_letters_set_updated_at
  BEFORE UPDATE ON public.compliance_update_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_legislation_updated_at();

ALTER TABLE public.compliance_update_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_update_letters_select
  ON public.compliance_update_letters FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY compliance_update_letters_insert
  ON public.compliance_update_letters FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY compliance_update_letters_update
  ON public.compliance_update_letters FOR UPDATE
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Cron mensal: dia 1 de cada mês às 06:00 UTC (= 03:00 BRT). Aciona a edge
-- function `compliance-update-letter-cron`, que itera as branches ativas e
-- dispara a geração da carta do mês imediatamente anterior.
--
-- O JWT usado pelo cron é lido em RUNTIME do `vault` (não embutido no SQL),
-- pra evitar vazar credencial pelo histórico do git. Antes de habilitar
-- o cron numa instância nova, o operador precisa popular o secret:
--
--   SELECT vault.create_secret(
--     '<anon-jwt-do-projeto>',
--     'cron_invoke_jwt',
--     'JWT anon usado pelo pg_cron para invocar edge functions internas'
--   );
--
-- Se o secret estiver vazio quando o cron disparar, a chamada vira
-- "Bearer " (sem token) e a edge function rejeita com 401 — falha
-- explícita e localizável, melhor do que silencioso.
--
-- Documentação completa em supabase/functions/_shared/REQUIRED_SECRETS.md.

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
