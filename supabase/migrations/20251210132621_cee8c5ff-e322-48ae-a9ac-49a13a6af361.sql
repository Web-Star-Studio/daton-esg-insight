-- Função que calcula a aplicabilidade geral baseada nas avaliações das unidades
CREATE OR REPLACE FUNCTION public.calculate_overall_applicability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_legislation_id UUID;
  v_real_count INT;
  v_potential_count INT;
  v_revoked_count INT;
  v_na_count INT;
  v_total_count INT;
  v_new_applicability TEXT;
BEGIN
  -- Determinar qual legislation_id usar
  v_legislation_id := COALESCE(NEW.legislation_id, OLD.legislation_id);
  
  -- Contar avaliações por tipo de aplicabilidade
  SELECT 
    COUNT(*) FILTER (WHERE applicability = 'real'),
    COUNT(*) FILTER (WHERE applicability = 'potential'),
    COUNT(*) FILTER (WHERE applicability = 'revoked'),
    COUNT(*) FILTER (WHERE applicability = 'na'),
    COUNT(*)
  INTO v_real_count, v_potential_count, v_revoked_count, v_na_count, v_total_count
  FROM public.legislation_unit_compliance
  WHERE legislation_id = v_legislation_id;
  
  -- Determinar aplicabilidade geral baseada na predominância
  -- Regra: Se qualquer unidade marcou "real" → overall = 'real'
  -- Se TODAS marcaram "revoked" → overall = 'revoked'
  -- Se TODAS marcaram "na" → overall = 'na'
  -- Caso contrário → overall = 'potential'
  IF v_total_count = 0 THEN
    v_new_applicability := 'potential'; -- Default quando não há avaliações
  ELSIF v_real_count > 0 THEN
    v_new_applicability := 'real'; -- Se qualquer unidade marcou como real
  ELSIF v_revoked_count = v_total_count THEN
    v_new_applicability := 'revoked'; -- Só se TODAS marcaram revoked
  ELSIF v_na_count = v_total_count THEN
    v_new_applicability := 'na'; -- Só se TODAS marcaram N/A
  ELSE
    v_new_applicability := 'potential'; -- Caso padrão (misto)
  END IF;
  
  -- Atualizar a legislação com a nova aplicabilidade geral
  UPDATE public.legislations 
  SET overall_applicability = v_new_applicability,
      updated_at = now()
  WHERE id = v_legislation_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para INSERT e UPDATE na coluna applicability
CREATE TRIGGER trigger_calculate_applicability_on_upsert
AFTER INSERT OR UPDATE OF applicability ON public.legislation_unit_compliance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_overall_applicability();

-- Trigger separado para DELETE
CREATE TRIGGER trigger_calculate_applicability_on_delete
AFTER DELETE ON public.legislation_unit_compliance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_overall_applicability();

-- Recalcular aplicabilidade para todas as legislações existentes que têm avaliações
WITH compliance_stats AS (
  SELECT 
    legislation_id,
    COUNT(*) FILTER (WHERE applicability = 'real') as real_count,
    COUNT(*) FILTER (WHERE applicability = 'potential') as potential_count,
    COUNT(*) FILTER (WHERE applicability = 'revoked') as revoked_count,
    COUNT(*) FILTER (WHERE applicability = 'na') as na_count,
    COUNT(*) as total_count
  FROM public.legislation_unit_compliance
  GROUP BY legislation_id
)
UPDATE public.legislations l
SET overall_applicability = CASE
  WHEN cs.real_count > 0 THEN 'real'
  WHEN cs.revoked_count = cs.total_count THEN 'revoked'
  WHEN cs.na_count = cs.total_count THEN 'na'
  ELSE 'potential'
END,
updated_at = now()
FROM compliance_stats cs
WHERE l.id = cs.legislation_id;