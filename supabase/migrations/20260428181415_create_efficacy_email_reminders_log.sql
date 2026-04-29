-- Log de envios da edge function `efficacy-evaluation-reminder`. Usado pra
-- garantir idempotência (1 e-mail por evaluator/empresa/dia) sem depender da
-- tabela `notifications` (que exige user_id NOT NULL — e o evaluator pode
-- não ter user vinculado).
CREATE TABLE IF NOT EXISTS public.efficacy_email_reminders_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluator_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  evaluator_email text NOT NULL,
  training_count  integer NOT NULL,
  resend_id       text,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  sent_date       date GENERATED ALWAYS AS ((sent_at AT TIME ZONE 'UTC')::date) STORED
);

-- Idempotência: 1 envio por (evaluator, dia). Usa sent_date (date) pra
-- comparação O(1) sem range scan no timestamp.
CREATE UNIQUE INDEX IF NOT EXISTS efficacy_email_reminders_log_evaluator_day_uniq
  ON public.efficacy_email_reminders_log (evaluator_employee_id, sent_date);

CREATE INDEX IF NOT EXISTS efficacy_email_reminders_log_company_idx
  ON public.efficacy_email_reminders_log (company_id, sent_date DESC);

-- RLS: só platform admins ou service_role escrevem; usuários da empresa leem
-- seu próprio histórico.
ALTER TABLE public.efficacy_email_reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY efficacy_email_reminders_log_company_read
  ON public.efficacy_email_reminders_log
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Service role bypassa RLS por padrão; sem policy explícita pra INSERT/UPDATE
-- de usuário comum (intencional — só edge function escreve).
