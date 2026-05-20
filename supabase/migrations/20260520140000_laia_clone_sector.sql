-- Clonagem de setor LAIA: criar um novo setor reaproveitando os aspectos e
-- impactos de um setor já existente. A cliente cadastra unidades que
-- compartilham as mesmas atividades; este fluxo evita recadastrar tudo do zero.
--
-- clone_laia_sector cria o setor + N avaliações numa única transação, para
-- não deixar um setor órfão caso uma das avaliações falhe. Os aspect_code são
-- regenerados a partir do código do novo setor (codigo.01, codigo.02, ...).
-- Os scores já vêm calculados do cliente (mesma lógica de createLAIAAssessment);
-- a função apenas insere, sem reimplementar a tabela de pontuação em PL/pgSQL.

CREATE OR REPLACE FUNCTION public.clone_laia_sector(
  p_branch_id UUID,
  p_code VARCHAR,
  p_name VARCHAR,
  p_description TEXT,
  p_assessments JSONB
)
RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_company_id UUID;
  v_sector_id UUID;
  v_item JSONB;
  v_idx INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa associada';
  END IF;

  -- A unidade alvo, quando informada, precisa pertencer à mesma empresa.
  IF p_branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = p_branch_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Unidade inválida para esta empresa';
  END IF;

  INSERT INTO public.laia_sectors (company_id, branch_id, code, name, description)
  VALUES (v_company_id, p_branch_id, p_code, p_name, NULLIF(p_description, ''))
  RETURNING id INTO v_sector_id;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_assessments, '[]'::jsonb))
  LOOP
    v_idx := v_idx + 1;

    INSERT INTO public.laia_assessments (
      company_id, branch_id, sector_id, aspect_code,
      activity_operation, environmental_aspect, environmental_impact,
      temporality, operational_situation, incidence, impact_class,
      scope, severity, consequence_score,
      frequency_probability, freq_prob_score, total_score, category,
      has_legal_requirements, has_stakeholder_demand, has_strategic_options, significance,
      control_types, existing_controls, legislation_references,
      has_lifecycle_control, lifecycle_stages, output_actions,
      responsible_user_id, notes, status, is_vigente
    )
    VALUES (
      v_company_id,
      p_branch_id,
      v_sector_id,
      p_code || '.' || lpad(v_idx::text, 2, '0'),
      v_item->>'activity_operation',
      v_item->>'environmental_aspect',
      v_item->>'environmental_impact',
      v_item->>'temporality',
      v_item->>'operational_situation',
      v_item->>'incidence',
      v_item->>'impact_class',
      v_item->>'scope',
      v_item->>'severity',
      (v_item->>'consequence_score')::int,
      v_item->>'frequency_probability',
      (v_item->>'freq_prob_score')::int,
      (v_item->>'total_score')::int,
      v_item->>'category',
      COALESCE((v_item->>'has_legal_requirements')::boolean, false),
      COALESCE((v_item->>'has_stakeholder_demand')::boolean, false),
      COALESCE((v_item->>'has_strategic_options')::boolean, false),
      v_item->>'significance',
      CASE WHEN jsonb_typeof(v_item->'control_types') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(v_item->'control_types'))
        ELSE NULL END,
      NULLIF(v_item->>'existing_controls', ''),
      COALESCE(v_item->'legislation_references', '[]'::jsonb),
      COALESCE((v_item->>'has_lifecycle_control')::boolean, false),
      CASE WHEN jsonb_typeof(v_item->'lifecycle_stages') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(v_item->'lifecycle_stages'))
        ELSE NULL END,
      NULLIF(v_item->>'output_actions', ''),
      -- Só faz cast quando a string casa com o formato UUID; COALESCE/NULLIF
      -- não suprimem o erro 22P02 de um cast inválido.
      COALESCE(
        CASE
          WHEN v_item->>'responsible_user_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          THEN (v_item->>'responsible_user_id')::uuid
        END,
        v_user_id
      ),
      NULLIF(v_item->>'notes', ''),
      'ativo',
      COALESCE((v_item->>'is_vigente')::boolean, true)
    );
  END LOOP;

  RETURN v_sector_id;
END;
$$;

-- Lista os setores da empresa (todas as unidades) para o seletor de origem do
-- fluxo de clonagem, junto da unidade e da quantidade de aspectos não
-- excluídos (deleted_at IS NULL) — o número que será de fato copiado.
CREATE OR REPLACE FUNCTION public.get_laia_sectors_for_clone()
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  description TEXT,
  branch_id UUID,
  branch_name TEXT,
  assessment_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    s.id,
    s.code::text,
    s.name::text,
    s.description,
    s.branch_id,
    b.name::text AS branch_name,
    COALESCE(c.cnt, 0)::bigint AS assessment_count
  FROM public.laia_sectors s
  LEFT JOIN public.branches b ON b.id = s.branch_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM public.laia_assessments a
    WHERE a.sector_id = s.id AND a.deleted_at IS NULL
  ) c ON true
  WHERE s.company_id = (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
  ORDER BY s.code;
$$;

-- Chamadas apenas pelo app autenticado; anon não tem motivo para executá-las.
REVOKE EXECUTE ON FUNCTION public.clone_laia_sector(UUID, VARCHAR, VARCHAR, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_laia_sectors_for_clone() FROM anon;
