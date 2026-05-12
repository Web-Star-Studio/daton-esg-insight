-- Watchdog de legislações existentes.
--
-- Duas tabelas:
--
-- 1. `watchdog_run_audit` — ruído: 1 row por execução do watchdog,
--    independente de ter mudança ou não. Métrica operacional (qtos normas
--    checadas, custo, duração, sucesso). Criada PRIMEIRO porque os eventos
--    abaixo referenciam por FK.
--
-- 2. `legislation_change_events` — sinal: 1 row por (legislation_id, run)
--    quando o watchdog detecta alteração relevante. Cresce devagar porque
--    `no_change` NÃO entra aqui (vai pra audit). Indexado pra leitura por
--    company + período (consumido pela Carta Mensal).
--
-- Dedup compute-time: o watchdog identifica normas únicas via chave lógica
-- (norm_type, norm_number, issuing_body, publication_date) e checa 1×
-- mesmo que N empresas tenham vinculação à mesma norma. Quando detecta
-- mudança, fan-out: insere N rows em `legislation_change_events` (uma por
-- legislation_id que compartilha a chave). Mantém o schema atual
-- (legislations.company_id) sem refator e ainda assim escala linear-em-N
-- só na escrita, não na chamada IA.
--
-- Writes apenas via service role das edge functions; sem policies de
-- INSERT/UPDATE/DELETE pro usuário final. SELECT por `company_id`.

CREATE TABLE IF NOT EXISTS public.watchdog_run_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  triggered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','company')),
  scope_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('running','completed','failed')) DEFAULT 'running',
  normas_total int NOT NULL DEFAULT 0,
  normas_unique int NOT NULL DEFAULT 0,
  normas_checked int NOT NULL DEFAULT 0,
  change_events_created int NOT NULL DEFAULT 0,
  total_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  duration_ms int,
  error_text text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS watchdog_run_audit_started_idx
  ON public.watchdog_run_audit (started_at DESC);
CREATE INDEX IF NOT EXISTS watchdog_run_audit_scope_company_idx
  ON public.watchdog_run_audit (scope_company_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.legislation_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id uuid NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  watchdog_run_id uuid REFERENCES public.watchdog_run_audit(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  change_type text NOT NULL CHECK (change_type IN ('amended','revoked','superseded','clarified')),
  diff_summary text NOT NULL,
  source_url text,
  confidence numeric(3,2) CHECK (confidence BETWEEN 0 AND 1),
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legislation_change_events_company_idx
  ON public.legislation_change_events (company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS legislation_change_events_legislation_idx
  ON public.legislation_change_events (legislation_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS legislation_change_events_run_idx
  ON public.legislation_change_events (watchdog_run_id);

ALTER TABLE public.watchdog_run_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY legislation_change_events_select ON public.legislation_change_events FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Audit é admin-only: só platform_admin/admin enxerga (UI de governança).
-- Empresas-cliente não precisam ver o ruído operacional.
CREATE POLICY watchdog_run_audit_admin_select ON public.watchdog_run_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin','platform_admin')
    )
  );
