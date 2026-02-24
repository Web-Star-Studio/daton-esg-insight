-- Migrar setores órfãos para a unidade onde são mais usados
UPDATE laia_sectors s
SET branch_id = sub.branch_id
FROM (
  SELECT DISTINCT ON (sector_id) sector_id, branch_id
  FROM (
    SELECT a.sector_id, a.branch_id, COUNT(*) as cnt
    FROM laia_assessments a
    WHERE a.sector_id IS NOT NULL AND a.branch_id IS NOT NULL
    GROUP BY a.sector_id, a.branch_id
    ORDER BY a.sector_id, cnt DESC
  ) ranked
) sub
WHERE s.id = sub.sector_id AND s.branch_id IS NULL;