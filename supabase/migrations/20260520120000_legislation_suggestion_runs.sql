-- Registro de buscas de sugestão de legislação (job em background).
--
-- Antes: a edge function `legislation-suggestions-from-profile` era
-- compute-on-demand, síncrona e sem persistência — o usuário não sabia
-- quando a busca começava/terminava, e o resultado sumia ao trocar de
-- aba. Agora cada disparo cria 1 row aqui (status='running'), o agente
-- roda em background (`EdgeRuntime.waitUntil`) e atualiza a row no fim.
-- A UI lê o histórico por unidade e acompanha o status (polling +
-- realtime). Espelha o padrão de `watchdog_run_audit`.
--
-- `publish_status='draft'` por padrão: a run fica visível só para
-- admins da org e para quem a disparou, até ser publicada (validação
-- com o cliente antes de liberar para a empresa toda).

CREATE TABLE IF NOT EXISTS public.legislation_suggestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id  uuid NOT NULL REFERENCES public.branches(id)  ON DELETE CASCADE,
  triggered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed')),
  expand_ai boolean NOT NULL DEFAULT false,
  ai_used   boolean NOT NULL DEFAULT false,
  ai_failed boolean NOT NULL DEFAULT false,
  ai_error  text,
  tag_count        int NOT NULL DEFAULT 0,
  matched_count    int NOT NULL DEFAULT 0,
  discovered_count int NOT NULL DEFAULT 0,
  -- payload completo do que foi sugerido — é isto que fica "registrado"
  -- para o usuário revisar e aceitar depois.
  matched    jsonb NOT NULL DEFAULT '[]'::jsonb,
  discovered jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_text text,
  publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft','published')),
  published_at timestamptz,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms  int
);

CREATE INDEX IF NOT EXISTS legislation_suggestion_runs_branch_idx
  ON public.legislation_suggestion_runs (branch_id, started_at DESC);
CREATE INDEX IF NOT EXISTS legislation_suggestion_runs_company_idx
  ON public.legislation_suggestion_runs (company_id, started_at DESC);

-- No máximo uma run 'running' por unidade ao mesmo tempo. Torna a
-- deduplicação atômica: um INSERT concorrente (duplo-clique, 2 abas, 2
-- usuários) falha com unique_violation (23505) e a edge function devolve
-- a run em andamento. Como o índice é parcial, runs completed/failed não
-- ocupam slot — a unidade fica livre para uma nova busca assim que a
-- anterior termina.
CREATE UNIQUE INDEX IF NOT EXISTS legislation_suggestion_runs_one_running_per_branch
  ON public.legislation_suggestion_runs (branch_id)
  WHERE status = 'running';

ALTER TABLE public.legislation_suggestion_runs ENABLE ROW LEVEL SECURITY;

-- SELECT: dentro da empresa. Rascunho aparece só para admin/platform_admin
-- ou para quem disparou a run; uma run publicada aparece para todos da
-- empresa.
CREATE POLICY legislation_suggestion_runs_select
  ON public.legislation_suggestion_runs FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
      publish_status = 'published'
      OR triggered_by = auth.uid()
      OR EXISTS (
        -- `user_roles` é company-scoped: o papel de admin precisa ser DA
        -- empresa dona da row, senão um admin de outra empresa enxergaria
        -- rascunhos alheios.
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND company_id = legislation_suggestion_runs.company_id
          AND role IN ('admin','platform_admin')
      )
    )
  );

-- Writes (INSERT da run, UPDATE de status/resultado) só via service role
-- da edge function — sem policy de INSERT/UPDATE/DELETE para o usuário
-- final. A publicação é feita pela função SECURITY DEFINER abaixo.

-- Realtime: a UI assina mudanças para saber quando a run termina sem
-- depender só de polling.
ALTER TABLE public.legislation_suggestion_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legislation_suggestion_runs;

-- Publica uma run: admin/platform_admin da empresa marca a run como
-- 'published', tornando-a visível para a empresa inteira.
CREATE OR REPLACE FUNCTION public.publish_suggestion_run(p_run_id uuid)
RETURNS public.legislation_suggestion_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_company uuid;
  v_is_admin boolean;
  v_run public.legislation_suggestion_runs;
BEGIN
  SELECT company_id INTO v_caller_company
  FROM public.profiles WHERE id = auth.uid();

  -- O papel de admin precisa ser DA empresa do caller — `user_roles` é
  -- company-scoped, então sem este filtro um admin de outra empresa
  -- conseguiria publicar runs aqui (escalonamento de privilégio).
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = v_caller_company
      AND role IN ('admin','platform_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'apenas admin pode publicar uma run de sugestões';
  END IF;

  UPDATE public.legislation_suggestion_runs
  SET publish_status = 'published',
      published_at = now(),
      published_by = auth.uid()
  WHERE id = p_run_id
    AND company_id = v_caller_company
  RETURNING * INTO v_run;

  IF v_run.id IS NULL THEN
    RAISE EXCEPTION 'run não encontrada nesta empresa';
  END IF;

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_suggestion_run(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_suggestion_run(uuid) TO authenticated;
