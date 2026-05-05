-- Duas mudanças coordenadas:
--
--   1) `profiles.is_internal_tester` — flag pra excluir testers internos
--      (Webstar/Daton) das métricas que mostramos pro cliente. Sem isso,
--      heavy user de teste distorce todos os números (ex: João Pedro
--      tinha 289 pageviews na Gabardo, ofuscando uso real do cliente).
--
--   2) Backfill `page_view_logs.route_pattern` — antes da migration de
--      29/abr os pageviews salvavam só `pathname` literal. 717 das 838
--      rows da Gabardo ficaram sem pattern, perdendo agregação por rota.
--      A função SQL `public.compute_route_pattern` replica a heurística
--      do client (`src/lib/routePattern.ts`): UUID, numérico e hash 16+
--      com dígito viram `:id`. Idempotente — pode rodar de novo sem
--      duplicar nada.

-- ============================================================
-- 1) is_internal_tester
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_internal_tester boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_internal_tester
  ON public.profiles (is_internal_tester)
  WHERE is_internal_tester = true;

-- Marca João Pedro (jpbs@cesar.school) como tester interno na Gabardo.
-- Match por id explícito pra não depender de coluna de email no profile.
UPDATE public.profiles
SET is_internal_tester = true
WHERE id = '9a67e806-6f97-4de8-a0dd-da5a5e8928d9';

-- ============================================================
-- 2) Função pra computar route_pattern + backfill
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_route_pattern(pathname text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN pathname IS NULL OR pathname = '' THEN pathname
    WHEN pathname = '/' THEN '/'
    ELSE
      '/' || array_to_string(
        ARRAY(
          SELECT CASE
            -- UUID v4-like (8-4-4-4-12 hex)
            WHEN seg ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN ':id'
            -- Segmento puramente numérico
            WHEN seg ~ '^\d+$' THEN ':id'
            -- Hash/slug com 16+ chars alfanuméricos contendo ao menos um dígito
            WHEN seg ~ '^[0-9a-zA-Z_-]{16,}$' AND seg ~ '\d' THEN ':id'
            ELSE seg
          END
          FROM unnest(string_to_array(trim(both '/' from pathname), '/')) AS seg
        ),
        '/'
      )
  END;
$$;

-- Backfill em batch único — só toca rows com route_pattern NULL.
UPDATE public.page_view_logs
SET route_pattern = public.compute_route_pattern(pathname)
WHERE route_pattern IS NULL;
