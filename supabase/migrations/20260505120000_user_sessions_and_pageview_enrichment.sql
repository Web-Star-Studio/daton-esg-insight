-- Tracking aprofundado de uso: sessões de atividade com heartbeat +
-- enriquecimento de page_view_logs com tempo na página, scroll, foco e
-- tipo de saída.
--
-- Justificativa em duas frases:
--   1) Hoje só sabemos QUE o user abriu uma página, não QUANTO TEMPO ficou
--      nem se realmente leu (scroll). Sem isso é impossível argumentar uso
--      real do sistema (poder de barganha em cobrança hora-base).
--   2) Não há noção de "sessão de uso": não dá pra dizer quantos minutos
--      por dia cada usuário gasta, nem detectar churn iminente por queda
--      de engajamento. user_activity_sessions resolve isso com heartbeat.
--
-- IMPORTANTE: o nome é `user_activity_sessions` e NÃO `user_sessions`,
-- porque já existe uma tabela `user_sessions` no schema (auth tokens com
-- session_token, expires_at, is_current). Não confundir.
--
-- Decisões de design:
--   • RLS deixa o usuário gerenciar a PRÓPRIA sessão de atividade
--     (INSERT/UPDATE restritos a user_id = auth.uid()). Sem edge function.
--   • SELECT só pra platform_admin (igual ao resto da observability).
--   • page_view_logs.UPDATE limitado a authenticated user com user_id
--     próprio. Pageviews anônimos ficam sem dados de saída — aceito,
--     porque a maior parte do app é gated.
--   • session_id em page_view_logs amarra view↔sessão pra cohort/funil.

-- ============================================================
-- 1) user_activity_sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_activity_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  company_id        uuid,
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  -- 'logout' | 'idle_timeout' | 'tab_closed' | 'unknown'.
  -- Setado pelo client; se aba fecha sem flush, fica NULL e cron de
  -- retention pode marcar como 'tab_closed' depois de N min sem heartbeat.
  end_reason        text,
  active_seconds    integer NOT NULL DEFAULT 0,
  idle_seconds      integer NOT NULL DEFAULT 0,
  heartbeat_count   integer NOT NULL DEFAULT 0,
  user_agent        text,
  device_type       text,    -- 'mobile' | 'tablet' | 'desktop'
  viewport_w        integer,
  viewport_h        integer,
  timezone          text,
  locale            text
);

CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_user
  ON public.user_activity_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_company
  ON public.user_activity_sessions (company_id, started_at DESC);
-- "Quem está online agora" — query frequente no admin.
CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_last_seen
  ON public.user_activity_sessions (last_seen_at DESC)
  WHERE ended_at IS NULL;

ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own activity session"
  ON public.user_activity_sessions;
CREATE POLICY "Users can insert their own activity session"
  ON public.user_activity_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own activity session"
  ON public.user_activity_sessions;
CREATE POLICY "Users can update their own activity session"
  ON public.user_activity_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read their own activity sessions"
  ON public.user_activity_sessions;
CREATE POLICY "Users can read their own activity sessions"
  ON public.user_activity_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Platform admins can read all activity sessions"
  ON public.user_activity_sessions;
CREATE POLICY "Platform admins can read all activity sessions"
  ON public.user_activity_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ============================================================
-- 2) Enriquecimento de page_view_logs
-- ============================================================

ALTER TABLE public.page_view_logs
  ADD COLUMN IF NOT EXISTS time_on_page_ms  integer,
  ADD COLUMN IF NOT EXISTS max_scroll_pct   smallint,
  ADD COLUMN IF NOT EXISTS had_focus_ms     integer,
  -- 'navigate' (clicou link interno), 'close' (fechou aba/janela),
  -- 'background' (mudou de aba), 'reload', 'unknown'.
  ADD COLUMN IF NOT EXISTS exit_type        text,
  ADD COLUMN IF NOT EXISTS viewport_w       integer,
  ADD COLUMN IF NOT EXISTS viewport_h       integer,
  ADD COLUMN IF NOT EXISTS device_type      text,
  -- FK lógica para public.user_activity_sessions(id). Sem REFERENCES
  -- formal pra não bloquear cascade em retention/cleanup desalinhado.
  ADD COLUMN IF NOT EXISTS session_id       uuid;

CREATE INDEX IF NOT EXISTS idx_page_view_logs_session
  ON public.page_view_logs (session_id, viewed_at);

-- UPDATE só do usuário autenticado dono da row. Anon não atualiza.
-- (INSERT já é livre via "Anyone can insert page views".)
DROP POLICY IF EXISTS "Users can update their own page views"
  ON public.page_view_logs;
CREATE POLICY "Users can update their own page views"
  ON public.page_view_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3) View auxiliar: sessões de atividade "ao vivo"
-- ============================================================
-- Define "online" como sessão sem ended_at e com heartbeat nos últimos
-- 2 minutos. Pode ser consultada no admin sem ter que escrever a regra
-- em N lugares.
CREATE OR REPLACE VIEW public.live_user_activity_sessions
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.user_id,
  s.company_id,
  s.started_at,
  s.last_seen_at,
  s.active_seconds,
  s.heartbeat_count,
  s.device_type
FROM public.user_activity_sessions s
WHERE s.ended_at IS NULL
  AND s.last_seen_at >= now() - INTERVAL '2 minutes';
