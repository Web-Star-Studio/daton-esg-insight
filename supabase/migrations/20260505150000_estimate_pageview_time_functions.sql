-- Funções pra estimar tempo de uso a partir de gaps entre pageviews
-- consecutivos do mesmo usuário.
--
-- Por que existe: o `time_on_page_ms` só começa a popular após o deploy
-- da Sprint 1, e mesmo aí cobre só pageviews novos. Pra ter argumento
-- de uso HOJE (com 838+ pageviews históricos da Gabardo), estimamos via
-- `LEAD(viewed_at) - viewed_at` por usuário.
--
-- Heurística:
--   • gap > 30 min entre pageviews → considerada nova sessão; descarta
--   • cada gap é capado em 5 min (300s) → evita "ficou aberto a noite"
--     inflar o tempo total de uma página
--   • combinada com tempo real (`time_on_page_ms`) quando disponível:
--     prioriza o real, complementa com estimativa onde for null
--
-- Disponíveis para platform_admin via RPC. RLS já cuida da segurança
-- (página de admin requer is_platform_admin).

-- Estimativa de tempo total por USUÁRIO de uma empresa, em segundos.
-- Exclui testers internos automaticamente.
CREATE OR REPLACE FUNCTION public.estimate_user_pageview_seconds(
  p_company_id uuid,
  p_since timestamptz
)
RETURNS TABLE (
  user_id          uuid,
  full_name        text,
  estimated_seconds integer,
  pageviews        integer,
  active_days      integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH gaps AS (
    SELECT
      pv.user_id,
      pv.viewed_at,
      pv.time_on_page_ms,
      EXTRACT(EPOCH FROM (
        LEAD(pv.viewed_at) OVER (PARTITION BY pv.user_id ORDER BY pv.viewed_at) - pv.viewed_at
      )) AS gap_seconds
    FROM public.page_view_logs pv
    LEFT JOIN public.profiles pr ON pr.id = pv.user_id
    WHERE pv.company_id = p_company_id
      AND pv.viewed_at >= p_since
      AND pv.user_id IS NOT NULL
      AND COALESCE(pr.is_internal_tester, false) = false
  )
  SELECT
    g.user_id,
    pr.full_name,
    -- Soma: prefere tempo real quando existe, senão estimativa via gap
    -- capada em 300s e só se gap < 1800s.
    COALESCE(
      SUM(
        CASE
          WHEN g.time_on_page_ms IS NOT NULL THEN g.time_on_page_ms / 1000.0
          WHEN g.gap_seconds IS NOT NULL AND g.gap_seconds < 1800
            THEN LEAST(g.gap_seconds, 300)
          ELSE 0
        END
      )::int,
      0
    ) AS estimated_seconds,
    COUNT(*)::int AS pageviews,
    COUNT(DISTINCT DATE(g.viewed_at))::int AS active_days
  FROM gaps g
  LEFT JOIN public.profiles pr ON pr.id = g.user_id
  GROUP BY g.user_id, pr.full_name;
$$;

-- Estimativa de tempo total por ROTA de uma empresa, em segundos.
CREATE OR REPLACE FUNCTION public.estimate_route_pageview_seconds(
  p_company_id uuid,
  p_since timestamptz
)
RETURNS TABLE (
  route_pattern    text,
  estimated_seconds integer,
  pageviews        integer,
  unique_users     integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH gaps AS (
    SELECT
      pv.route_pattern,
      pv.user_id,
      pv.time_on_page_ms,
      EXTRACT(EPOCH FROM (
        LEAD(pv.viewed_at) OVER (PARTITION BY pv.user_id ORDER BY pv.viewed_at) - pv.viewed_at
      )) AS gap_seconds
    FROM public.page_view_logs pv
    LEFT JOIN public.profiles pr ON pr.id = pv.user_id
    WHERE pv.company_id = p_company_id
      AND pv.viewed_at >= p_since
      AND pv.user_id IS NOT NULL
      AND COALESCE(pr.is_internal_tester, false) = false
  )
  SELECT
    COALESCE(g.route_pattern, '(unknown)') AS route_pattern,
    COALESCE(
      SUM(
        CASE
          WHEN g.time_on_page_ms IS NOT NULL THEN g.time_on_page_ms / 1000.0
          WHEN g.gap_seconds IS NOT NULL AND g.gap_seconds < 1800
            THEN LEAST(g.gap_seconds, 300)
          ELSE 0
        END
      )::int,
      0
    ) AS estimated_seconds,
    COUNT(*)::int AS pageviews,
    COUNT(DISTINCT g.user_id)::int AS unique_users
  FROM gaps g
  GROUP BY g.route_pattern;
$$;
