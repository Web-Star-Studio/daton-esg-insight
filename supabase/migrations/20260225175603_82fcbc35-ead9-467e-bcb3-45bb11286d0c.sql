
-- RPC 1: Branch stats for unit gallery cards
CREATE OR REPLACE FUNCTION public.get_laia_branch_stats(p_company_id UUID)
RETURNS TABLE (
  branch_id UUID,
  total BIGINT,
  criticos BIGINT,
  significativos BIGINT,
  nao_significativos BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    a.branch_id,
    COUNT(*)::BIGINT AS total,
    COALESCE(SUM(CASE WHEN a.category = 'critico' THEN 1 ELSE 0 END), 0)::BIGINT AS criticos,
    COALESCE(SUM(CASE WHEN a.significance = 'significativo' THEN 1 ELSE 0 END), 0)::BIGINT AS significativos,
    COALESCE(SUM(CASE WHEN a.significance != 'significativo' OR a.significance IS NULL THEN 1 ELSE 0 END), 0)::BIGINT AS nao_significativos
  FROM public.laia_assessments a
  WHERE a.company_id = p_company_id AND a.status = 'ativo'
  GROUP BY a.branch_id;
$$;

-- RPC 2: Dashboard stats for a specific branch (or all branches)
CREATE OR REPLACE FUNCTION public.get_laia_dashboard_stats(
  p_company_id UUID,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'significativos', COALESCE(SUM(CASE WHEN significance = 'significativo' THEN 1 ELSE 0 END), 0),
    'nao_significativos', COALESCE(SUM(CASE WHEN significance != 'significativo' OR significance IS NULL THEN 1 ELSE 0 END), 0),
    'criticos', COALESCE(SUM(CASE WHEN category = 'critico' THEN 1 ELSE 0 END), 0),
    'moderados', COALESCE(SUM(CASE WHEN category = 'moderado' THEN 1 ELSE 0 END), 0),
    'despreziveis', COALESCE(SUM(CASE WHEN category = 'desprezivel' THEN 1 ELSE 0 END), 0),
    'by_sector', COALESCE((
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT COALESCE(ls.name, 'Sem setor') AS sector_name, COUNT(*) AS count
        FROM public.laia_assessments la
        LEFT JOIN public.laia_sectors ls ON la.sector_id = ls.id
        WHERE la.company_id = p_company_id AND la.status = 'ativo'
          AND (p_branch_id IS NULL OR la.branch_id = p_branch_id)
        GROUP BY ls.name
        ORDER BY count DESC
      ) s
    ), '[]'::json),
    'by_temporality', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT temporality AS name, COUNT(*) AS value
        FROM public.laia_assessments
        WHERE company_id = p_company_id AND status = 'ativo'
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY temporality
      ) t
    ), '[]'::json),
    'by_operational_situation', COALESCE((
      SELECT json_agg(row_to_json(o))
      FROM (
        SELECT operational_situation AS name, COUNT(*) AS value
        FROM public.laia_assessments
        WHERE company_id = p_company_id AND status = 'ativo'
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY operational_situation
      ) o
    ), '[]'::json),
    'by_incidence', COALESCE((
      SELECT json_agg(row_to_json(i))
      FROM (
        SELECT incidence AS name, COUNT(*) AS value
        FROM public.laia_assessments
        WHERE company_id = p_company_id AND status = 'ativo'
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY incidence
      ) i
    ), '[]'::json),
    'by_impact_class', COALESCE((
      SELECT json_agg(row_to_json(ic))
      FROM (
        SELECT impact_class AS name, COUNT(*) AS value
        FROM public.laia_assessments
        WHERE company_id = p_company_id AND status = 'ativo'
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY impact_class
      ) ic
    ), '[]'::json)
  ) INTO result
  FROM public.laia_assessments
  WHERE company_id = p_company_id AND status = 'ativo'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  RETURN result;
END;
$$;
