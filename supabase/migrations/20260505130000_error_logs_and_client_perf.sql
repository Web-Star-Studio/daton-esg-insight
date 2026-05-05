-- Tracking de erros de cliente e Web Vitals.
--
-- Por que existe:
--   1) `error_logs` — sem isso, erros JS no client são invisíveis pro
--      admin. Sentry/Datadog seriam ideais mas custam — esse mínimo
--      cobre 80% (mensagem, stack, route, user, frequência).
--   2) `client_perf_logs` — Web Vitals (LCP, FCP, CLS, INP, TTFB) por
--      rota. Precisa pra dizer ao cliente "essa página está lenta porque
--      LCP=4.2s, p95=6.1s nos seus usuários".
--
-- RLS: leitura platform_admin, INSERT autenticado (com user_id próprio
-- ou anon na chave anon — perf no público também é útil).

-- ============================================================
-- 1) error_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  user_id         uuid,
  company_id      uuid,
  session_id      uuid,
  route_pattern   text,
  pathname        text,
  -- 'js_error'    → window.onerror
  -- 'unhandled'   → unhandledrejection
  -- 'network'     → fetch interceptor failure
  -- 'react'       → ErrorBoundary caught
  -- 'manual'      → reportError(...) explícito
  source          text NOT NULL,
  message         text NOT NULL,
  stack           text,
  -- file/line/col disponíveis no event de window.onerror
  file_url        text,
  line_no         integer,
  col_no          integer,
  user_agent      text,
  -- Hash determinístico de (source + message + first stack frame) pra
  -- agrupar erros idênticos no admin sem fazer GROUP BY pesado.
  fingerprint     text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_error_logs_occurred_at
  ON public.error_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint
  ON public.error_logs (fingerprint, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_company
  ON public.error_logs (company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_route
  ON public.error_logs (route_pattern, occurred_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Anon pode logar erros de páginas públicas (landing); auth user
    -- só pode logar com seu próprio user_id ou null.
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Platform admins can read error logs" ON public.error_logs;
CREATE POLICY "Platform admins can read error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ============================================================
-- 2) client_perf_logs (Web Vitals)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_perf_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measured_at     timestamptz NOT NULL DEFAULT now(),
  user_id         uuid,
  company_id      uuid,
  session_id      uuid,
  route_pattern   text NOT NULL,
  pathname        text,
  -- Métrica padrão do `web-vitals`. Salvamos individualmente (uma row
  -- por métrica reportada) pra facilitar p50/p95/p99 por métrica.
  -- 'LCP' | 'FCP' | 'CLS' | 'INP' | 'TTFB' | 'FID'
  metric          text NOT NULL,
  value           numeric NOT NULL,
  -- 'good' | 'needs-improvement' | 'poor' (vem do `web-vitals`)
  rating          text,
  navigation_type text,
  device_type     text,
  user_agent      text
);

CREATE INDEX IF NOT EXISTS idx_client_perf_logs_measured
  ON public.client_perf_logs (measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_perf_logs_route_metric
  ON public.client_perf_logs (route_pattern, metric, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_perf_logs_company
  ON public.client_perf_logs (company_id, measured_at DESC);

ALTER TABLE public.client_perf_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert client perf"
  ON public.client_perf_logs;
CREATE POLICY "Anyone can insert client perf"
  ON public.client_perf_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Platform admins can read client perf"
  ON public.client_perf_logs;
CREATE POLICY "Platform admins can read client perf"
  ON public.client_perf_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());
