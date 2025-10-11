-- Create full-text search function for global intelligent search
CREATE OR REPLACE FUNCTION public.search_across_tables(
  search_query TEXT,
  user_company_id UUID,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  type TEXT,
  category TEXT,
  url TEXT,
  relevance NUMERIC,
  last_modified TIMESTAMPTZ,
  tags TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Search in Goals
  SELECT 
    g.id::TEXT,
    g.goal_name AS title,
    g.description,
    'data'::TEXT AS type,
    'metas'::TEXT AS category,
    '/metas'::TEXT AS url,
    ts_rank(to_tsvector('portuguese', coalesce(g.goal_name, '') || ' ' || coalesce(g.description, '')), 
            plainto_tsquery('portuguese', search_query)) AS relevance,
    g.updated_at AS last_modified,
    ARRAY['meta', g.status]::TEXT[] AS tags
  FROM goals g
  WHERE g.company_id = user_company_id
    AND (
      to_tsvector('portuguese', coalesce(g.goal_name, '') || ' ' || coalesce(g.description, '')) 
      @@ plainto_tsquery('portuguese', search_query)
    )
  
  UNION ALL
  
  -- Search in Tasks
  SELECT 
    t.id::TEXT,
    t.name AS title,
    coalesce(t.description, 'Tarefa de coleta de dados') AS description,
    'action'::TEXT AS type,
    'tarefas'::TEXT AS category,
    '/gestao-tarefas'::TEXT AS url,
    ts_rank(to_tsvector('portuguese', coalesce(t.name, '') || ' ' || coalesce(t.description, '')), 
            plainto_tsquery('portuguese', search_query)) AS relevance,
    t.updated_at AS last_modified,
    ARRAY['tarefa', t.status, t.task_type]::TEXT[] AS tags
  FROM data_collection_tasks t
  WHERE t.company_id = user_company_id
    AND (
      to_tsvector('portuguese', coalesce(t.name, '') || ' ' || coalesce(t.description, '')) 
      @@ plainto_tsquery('portuguese', search_query)
    )
  
  UNION ALL
  
  -- Search in Documents
  SELECT 
    d.id::TEXT,
    d.file_name AS title,
    coalesce(d.file_type, 'Documento') AS description,
    'document'::TEXT AS type,
    'documentos'::TEXT AS category,
    '/documentos'::TEXT AS url,
    ts_rank(to_tsvector('portuguese', coalesce(d.file_name, '') || ' ' || array_to_string(d.tags, ' ')), 
            plainto_tsquery('portuguese', search_query)) AS relevance,
    d.upload_date AS last_modified,
    d.tags::TEXT[] AS tags
  FROM documents d
  WHERE d.company_id = user_company_id
    AND (
      to_tsvector('portuguese', coalesce(d.file_name, '') || ' ' || array_to_string(d.tags, ' ')) 
      @@ plainto_tsquery('portuguese', search_query)
    )
  
  UNION ALL
  
  -- Search in Emission Sources
  SELECT 
    es.id::TEXT,
    es.source_name AS title,
    coalesce(es.description, 'Fonte de emissão') AS description,
    'data'::TEXT AS type,
    'emissoes'::TEXT AS category,
    '/inventario-gee'::TEXT AS url,
    ts_rank(to_tsvector('portuguese', coalesce(es.source_name, '') || ' ' || coalesce(es.description, '')), 
            plainto_tsquery('portuguese', search_query)) AS relevance,
    es.updated_at AS last_modified,
    ARRAY['emissão', 'escopo ' || es.scope::TEXT]::TEXT[] AS tags
  FROM emission_sources es
  WHERE es.company_id = user_company_id
    AND (
      to_tsvector('portuguese', coalesce(es.source_name, '') || ' ' || coalesce(es.description, '')) 
      @@ plainto_tsquery('portuguese', search_query)
    )
  
  UNION ALL
  
  -- Search in Licenses
  SELECT 
    l.id::TEXT,
    l.license_name AS title,
    coalesce(l.license_number, 'Licença ambiental') AS description,
    'data'::TEXT AS type,
    'licencas'::TEXT AS category,
    '/licenciamento'::TEXT AS url,
    ts_rank(to_tsvector('portuguese', coalesce(l.license_name, '') || ' ' || coalesce(l.license_number, '')), 
            plainto_tsquery('portuguese', search_query)) AS relevance,
    l.updated_at AS last_modified,
    ARRAY['licença', l.license_type, l.status]::TEXT[] AS tags
  FROM licenses l
  WHERE l.company_id = user_company_id
    AND (
      to_tsvector('portuguese', coalesce(l.license_name, '') || ' ' || coalesce(l.license_number, '')) 
      @@ plainto_tsquery('portuguese', search_query)
    )
  
  ORDER BY relevance DESC
  LIMIT result_limit;
END;
$$;