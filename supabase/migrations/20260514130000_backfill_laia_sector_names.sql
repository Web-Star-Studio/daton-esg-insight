-- Backfill: setores LAIA criados automaticamente pelo importador ficaram com
-- name = 'Setor <code>' (genérico). Isso só não causava bug visível porque a
-- listagem em LAIASectorManager mostrava activity_operation das assessments
-- vinculadas. Quando o cliente passou a criar setores manuais (sem assessment
-- ainda), a coluna ficou vazia. O fix de UI agora exibe sector.name primário —
-- então setores antigos precisam ter o name corrigido para o conteúdo real.
--
-- Estratégia: para cada setor genérico, escolher a activity_operation com mais
-- ocorrências nas assessments do próprio setor (tiebreaker: MIN(created_at),
-- depois alfabético). Setores sem assessment não são tocados.
--
-- Causa-raiz no código foi corrigida em src/services/laiaImport.ts.

BEGIN;

-- Tabela de auditoria com snapshot do estado anterior
CREATE TABLE IF NOT EXISTS public._laia_sectors_rename_audit_20260514 (
  sector_id uuid PRIMARY KEY,
  company_id uuid,
  branch_id uuid,
  code text,
  old_name text,
  new_name text,
  picked_occurrences integer,
  alternative_activities jsonb,
  renamed_at timestamptz NOT NULL DEFAULT now()
);

WITH generic_sectors AS (
  SELECT s.id, s.code, s.name AS current_name, s.company_id, s.branch_id
  FROM public.laia_sectors s
  WHERE s.name = 'Setor ' || s.code
),
activity_stats AS (
  SELECT
    gs.id AS sector_id,
    gs.code,
    gs.current_name,
    gs.company_id,
    gs.branch_id,
    btrim(a.activity_operation) AS activity_operation,
    COUNT(*) AS occurrences,
    MIN(a.created_at) AS first_seen
  FROM generic_sectors gs
  JOIN public.laia_assessments a ON a.sector_id = gs.id
  WHERE a.activity_operation IS NOT NULL
    AND btrim(a.activity_operation) <> ''
    AND a.activity_operation <> 'Não especificada'
  GROUP BY gs.id, gs.code, gs.current_name, gs.company_id, gs.branch_id, btrim(a.activity_operation)
),
ranked AS (
  SELECT
    sector_id, code, current_name, company_id, branch_id,
    activity_operation, occurrences, first_seen,
    ROW_NUMBER() OVER (
      PARTITION BY sector_id
      ORDER BY occurrences DESC, first_seen ASC, activity_operation ASC
    ) AS rk
  FROM activity_stats
),
alternatives AS (
  SELECT
    sector_id,
    jsonb_agg(
      jsonb_build_object('activity', activity_operation, 'occurrences', occurrences)
      ORDER BY occurrences DESC, first_seen ASC, activity_operation ASC
    ) AS alts
  FROM activity_stats
  GROUP BY sector_id
)
INSERT INTO public._laia_sectors_rename_audit_20260514
  (sector_id, company_id, branch_id, code, old_name, new_name, picked_occurrences, alternative_activities)
SELECT
  r.sector_id, r.company_id, r.branch_id, r.code, r.current_name,
  r.activity_operation, r.occurrences, alt.alts
FROM ranked r
JOIN alternatives alt ON alt.sector_id = r.sector_id
WHERE r.rk = 1
ON CONFLICT (sector_id) DO NOTHING;

-- Aplicar o novo name a partir da tabela de auditoria
UPDATE public.laia_sectors s
SET name = a.new_name,
    updated_at = now()
FROM public._laia_sectors_rename_audit_20260514 a
WHERE a.sector_id = s.id
  AND s.name = 'Setor ' || s.code      -- guarda contra re-run / drift
  AND a.new_name IS NOT NULL
  AND btrim(a.new_name) <> '';

COMMIT;
