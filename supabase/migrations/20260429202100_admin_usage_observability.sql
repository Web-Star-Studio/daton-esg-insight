-- Observabilidade do admin: cobertura de tracking ampliada para a página
-- de analytics da plataforma. Três mudanças coordenadas:
--
--   1) `page_view_logs.route_pattern` — padrão canônico da rota (ex.
--      `/licenciamento/:id`) para agregar pageviews de rotas dinâmicas.
--      Sem isso, `/licenciamento/abc` e `/licenciamento/xyz` aparecem como
--      rotas distintas e a lista de "rotas mortas" tem muito falso-positivo.
--
--   2) `event_logs` — eventos de negócio padronizados (login, export,
--      report_generated, document_uploaded, ai_chat_started etc.). Separa
--      do `activity_logs` (que é livre/auditoria) para ter contrato fechado
--      e indexação por event_type.
--
--   3) `ai_usage_logs` — uso e custo estimado de IA por chamada ao
--      gateway Lovable. Hoje 18+ edge functions chamam o gateway sem
--      registrar tokens nem custo; sem isso é impossível saber quanto
--      cada empresa/feature/modelo está gastando.
--
-- RLS: leitura só para platform_admin (helper `public.is_platform_admin()`
-- já existe). Escrita pelas edge functions via service_role (bypassa RLS).
-- `page_view_logs` continua aceitando INSERT anônimo (necessário pois o
-- tracking dispara antes do login).

-- ============================================================
-- 1) route_pattern em page_view_logs
-- ============================================================

ALTER TABLE public.page_view_logs
  ADD COLUMN IF NOT EXISTS route_pattern text;

CREATE INDEX IF NOT EXISTS idx_page_view_logs_route_pattern
  ON public.page_view_logs (route_pattern, viewed_at DESC);

-- Bloqueia SELECT pra não-admins (hoje a tabela só tem policy de INSERT;
-- na prática SELECT vinha caindo em fallback aberto pra service_role).
DROP POLICY IF EXISTS "Platform admins can read page views" ON public.page_view_logs;
CREATE POLICY "Platform admins can read page views"
  ON public.page_view_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ============================================================
-- 2) event_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  event_type   text NOT NULL,
  entity_type  text,
  entity_id    text,
  user_id      uuid,
  company_id   uuid,
  route_pattern text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at
  ON public.event_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_company
  ON public.event_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_type
  ON public.event_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_user
  ON public.event_logs (user_id, created_at DESC);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: qualquer usuário autenticado pode registrar evento da própria
-- sessão (similar ao tracking de pageview). Anônimos não escrevem aqui
-- porque event_logs é só pra eventos pós-login.
CREATE POLICY "Authenticated users can insert their own events"
  ON public.event_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- SELECT: só platform_admin (igual ao resto do tracking).
CREATE POLICY "Platform admins can read events"
  ON public.event_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ============================================================
-- 3) ai_usage_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  function_name        text NOT NULL,         -- nome da edge function (ex. 'daton-ai-chat')
  feature_tag          text,                  -- subdivisão lógica (ex. 'chat', 'ocr', 'gri-autofill')
  model                text NOT NULL,         -- ex. 'google/gemini-3-flash-preview'
  company_id           uuid,
  user_id              uuid,
  prompt_tokens        integer,
  completion_tokens    integer,
  total_tokens         integer,
  estimated_cost_usd   numeric(12, 6),        -- estimado a partir de tabela de preços versionada no código
  latency_ms           integer,
  success              boolean NOT NULL DEFAULT true,
  error_text           text,
  request_meta         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
  ON public.ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_company
  ON public.ai_usage_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_function
  ON public.ai_usage_logs (function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
  ON public.ai_usage_logs (model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user
  ON public.ai_usage_logs (user_id, created_at DESC);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Sem policy de INSERT pra usuário comum: só service_role (edge function
-- com `SUPABASE_SERVICE_ROLE_KEY`) escreve aqui. Bypassa RLS por design.
CREATE POLICY "Platform admins can read ai usage"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());
