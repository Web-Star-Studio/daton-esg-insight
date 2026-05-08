-- Observabilidade do agent runtime.
--
-- Cada execução de `runAgent` (helper em `supabase/functions/_shared/agent-runtime.ts`)
-- cria uma row em `agent_runs` no início e atualiza com status final no fim.
-- Cada turno do loop (LLM call OU tool call) gera 1 row em `agent_steps`,
-- preservando ordem via `step_index`.
--
-- O custo agregado por run é correlacionado com `ai_usage_logs` via
-- `request_meta->>'run_id'` — o helper passa `meta: { run_id }` no contexto
-- do `aiCall`. Para custo total da run:
--
--   SELECT SUM(estimated_cost_usd) FROM ai_usage_logs
--   WHERE request_meta->>'run_id' = '<run_id>';
--
-- Writes apenas via service role das edge functions; sem policies de
-- INSERT/UPDATE/DELETE para o usuário final. RLS de SELECT por
-- `company_id` (usuário só vê runs da própria empresa).

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id  uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  total_steps int NOT NULL DEFAULT 0,
  total_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  error_text text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_company_idx
  ON public.agent_runs (company_id, started_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_agent_idx
  ON public.agent_runs (agent_name, started_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_branch_idx
  ON public.agent_runs (branch_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  step_index int NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('llm_call', 'tool_call')),
  tool_name text,
  input jsonb,
  output jsonb,
  tokens_prompt int,
  tokens_completion int,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  duration_ms int,
  error_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_index)
);

CREATE INDEX IF NOT EXISTS agent_steps_run_idx
  ON public.agent_steps (run_id, step_index);

ALTER TABLE public.agent_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;

-- Leitura: só visualizam runs da própria empresa. Sem policies de write —
-- service role das edge functions é o único writer (bypass RLS via
-- SUPABASE_SERVICE_ROLE_KEY).
CREATE POLICY agent_runs_select ON public.agent_runs FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY agent_steps_select ON public.agent_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_runs r
    WHERE r.id = agent_steps.run_id
      AND r.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  ));
