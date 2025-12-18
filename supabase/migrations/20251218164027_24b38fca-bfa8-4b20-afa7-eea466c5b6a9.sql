-- Fase 5: Scoring & Cálculos

-- Tabela de configuração de pontuação por auditoria
CREATE TABLE IF NOT EXISTS public.audit_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  
  -- Método de cálculo
  scoring_method TEXT NOT NULL DEFAULT 'weighted', -- 'weighted', 'simple', 'percentage'
  
  -- Pesos por tipo de resposta (JSON com response_option_id -> weight)
  response_weights JSONB DEFAULT '{}',
  
  -- Penalidades por tipo de ocorrência
  nc_major_penalty NUMERIC DEFAULT 10,
  nc_minor_penalty NUMERIC DEFAULT 5,
  observation_penalty NUMERIC DEFAULT 2,
  opportunity_bonus NUMERIC DEFAULT 1,
  
  -- Configurações de cálculo
  include_na_in_total BOOLEAN DEFAULT false,
  max_score NUMERIC DEFAULT 100,
  passing_score NUMERIC DEFAULT 70,
  
  -- Pesos por sessão (JSON com session_id -> weight)
  session_weights JSONB DEFAULT '{}',
  
  -- Pesos por norma (JSON com standard_id -> weight)
  standard_weights JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(audit_id)
);

-- Tabela de resultados de pontuação (cache)
CREATE TABLE IF NOT EXISTS public.audit_scoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  
  -- Resultados gerais
  total_score NUMERIC NOT NULL DEFAULT 0,
  max_possible_score NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  
  -- Contadores
  total_items INTEGER DEFAULT 0,
  responded_items INTEGER DEFAULT 0,
  conforming_items INTEGER DEFAULT 0,
  non_conforming_items INTEGER DEFAULT 0,
  partial_items INTEGER DEFAULT 0,
  na_items INTEGER DEFAULT 0,
  
  -- Contadores de ocorrências
  nc_major_count INTEGER DEFAULT 0,
  nc_minor_count INTEGER DEFAULT 0,
  observation_count INTEGER DEFAULT 0,
  opportunity_count INTEGER DEFAULT 0,
  
  -- Resultados por sessão (JSON)
  session_scores JSONB DEFAULT '{}',
  
  -- Resultados por norma (JSON)
  standard_scores JSONB DEFAULT '{}',
  
  -- Classificação final
  grade TEXT, -- 'A', 'B', 'C', 'D', 'F' ou customizado
  status TEXT DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'conditional'
  
  -- Metadados de cálculo
  calculated_at TIMESTAMPTZ DEFAULT now(),
  calculated_by UUID REFERENCES auth.users(id),
  calculation_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(audit_id)
);

-- Tabela de configuração de grades
CREATE TABLE IF NOT EXISTS public.audit_grade_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  
  -- Configuração de grades (JSON array)
  -- [{ "grade": "A", "min_percentage": 90, "max_percentage": 100, "label": "Excelente", "color": "#22c55e" }]
  grades JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_scoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_grade_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage scoring config for their company"
  ON public.audit_scoring_config FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view scoring results for their company"
  ON public.audit_scoring_results FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage grade config for their company"
  ON public.audit_grade_config FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Indices
CREATE INDEX IF NOT EXISTS idx_scoring_config_audit ON public.audit_scoring_config(audit_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_audit ON public.audit_scoring_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_grade_config_company ON public.audit_grade_config(company_id);

-- Função para calcular pontuação de uma auditoria
CREATE OR REPLACE FUNCTION calculate_audit_score(p_audit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config audit_scoring_config%ROWTYPE;
  v_result JSONB;
  v_total_score NUMERIC := 0;
  v_max_score NUMERIC := 0;
  v_responded INTEGER := 0;
  v_conforming INTEGER := 0;
  v_non_conforming INTEGER := 0;
  v_partial INTEGER := 0;
  v_na INTEGER := 0;
  v_total INTEGER := 0;
  v_nc_major INTEGER := 0;
  v_nc_minor INTEGER := 0;
  v_obs INTEGER := 0;
  v_opp INTEGER := 0;
  v_percentage NUMERIC := 0;
  v_company_id UUID;
BEGIN
  -- Get company_id from audit
  SELECT company_id INTO v_company_id FROM audits WHERE id = p_audit_id;
  
  -- Get or create config
  SELECT * INTO v_config FROM audit_scoring_config WHERE audit_id = p_audit_id;
  
  IF v_config IS NULL THEN
    INSERT INTO audit_scoring_config (company_id, audit_id)
    VALUES (v_company_id, p_audit_id)
    RETURNING * INTO v_config;
  END IF;
  
  -- Count responses by type
  SELECT 
    COUNT(*) FILTER (WHERE ro.conformity_level = 'conforme'),
    COUNT(*) FILTER (WHERE ro.conformity_level = 'nao_conforme'),
    COUNT(*) FILTER (WHERE ro.conformity_level = 'parcial'),
    COUNT(*) FILTER (WHERE ro.conformity_level = 'nao_aplicavel'),
    COUNT(*)
  INTO v_conforming, v_non_conforming, v_partial, v_na, v_responded
  FROM audit_item_responses air
  JOIN audit_response_options ro ON air.response_option_id = ro.id
  WHERE air.audit_id = p_audit_id;
  
  -- Count total items
  SELECT COUNT(*) INTO v_total
  FROM audit_session_items asi
  JOIN audit_sessions s ON asi.session_id = s.id
  WHERE s.audit_id = p_audit_id;
  
  -- Count occurrences
  SELECT 
    COUNT(*) FILTER (WHERE occurrence_type = 'nc_maior'),
    COUNT(*) FILTER (WHERE occurrence_type = 'nc_menor'),
    COUNT(*) FILTER (WHERE occurrence_type = 'observacao'),
    COUNT(*) FILTER (WHERE occurrence_type = 'oportunidade')
  INTO v_nc_major, v_nc_minor, v_obs, v_opp
  FROM audit_occurrences
  WHERE audit_id = p_audit_id;
  
  -- Calculate score based on method
  IF v_config.scoring_method = 'simple' THEN
    -- Simple: conforming items / total items * 100
    IF v_config.include_na_in_total THEN
      v_max_score := v_total;
    ELSE
      v_max_score := v_total - v_na;
    END IF;
    v_total_score := v_conforming + (v_partial * 0.5);
    
  ELSIF v_config.scoring_method = 'weighted' THEN
    -- Weighted: use response weights
    SELECT COALESCE(SUM(
      CASE 
        WHEN ro.conformity_level = 'conforme' THEN COALESCE((v_config.response_weights->>ro.id::text)::numeric, ro.score_value)
        WHEN ro.conformity_level = 'parcial' THEN COALESCE((v_config.response_weights->>ro.id::text)::numeric, ro.score_value) * 0.5
        ELSE 0
      END
    ), 0)
    INTO v_total_score
    FROM audit_item_responses air
    JOIN audit_response_options ro ON air.response_option_id = ro.id
    WHERE air.audit_id = p_audit_id;
    
    -- Max score
    SELECT COALESCE(SUM(
      CASE WHEN v_config.include_na_in_total OR ro.conformity_level != 'nao_aplicavel'
        THEN COALESCE((v_config.response_weights->>ro.id::text)::numeric, ro.score_value)
        ELSE 0
      END
    ), v_total * 10) -- default 10 points per item
    INTO v_max_score
    FROM audit_item_responses air
    JOIN audit_response_options ro ON air.response_option_id = ro.id
    WHERE air.audit_id = p_audit_id;
    
  ELSE -- percentage
    v_max_score := 100;
    IF v_total > 0 THEN
      v_total_score := (v_conforming::numeric / GREATEST(v_total - v_na, 1)) * 100;
    END IF;
  END IF;
  
  -- Apply penalties
  v_total_score := v_total_score 
    - (v_nc_major * v_config.nc_major_penalty)
    - (v_nc_minor * v_config.nc_minor_penalty)
    - (v_obs * v_config.observation_penalty)
    + (v_opp * v_config.opportunity_bonus);
  
  -- Ensure non-negative
  v_total_score := GREATEST(v_total_score, 0);
  
  -- Calculate percentage
  IF v_max_score > 0 THEN
    v_percentage := (v_total_score / v_max_score) * 100;
  END IF;
  
  -- Upsert result
  INSERT INTO audit_scoring_results (
    company_id, audit_id, total_score, max_possible_score, percentage,
    total_items, responded_items, conforming_items, non_conforming_items,
    partial_items, na_items, nc_major_count, nc_minor_count,
    observation_count, opportunity_count, calculated_at
  ) VALUES (
    v_company_id, p_audit_id, v_total_score, v_max_score, v_percentage,
    v_total, v_responded, v_conforming, v_non_conforming,
    v_partial, v_na, v_nc_major, v_nc_minor,
    v_obs, v_opp, now()
  )
  ON CONFLICT (audit_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    max_possible_score = EXCLUDED.max_possible_score,
    percentage = EXCLUDED.percentage,
    total_items = EXCLUDED.total_items,
    responded_items = EXCLUDED.responded_items,
    conforming_items = EXCLUDED.conforming_items,
    non_conforming_items = EXCLUDED.non_conforming_items,
    partial_items = EXCLUDED.partial_items,
    na_items = EXCLUDED.na_items,
    nc_major_count = EXCLUDED.nc_major_count,
    nc_minor_count = EXCLUDED.nc_minor_count,
    observation_count = EXCLUDED.observation_count,
    opportunity_count = EXCLUDED.opportunity_count,
    calculated_at = now(),
    updated_at = now();
  
  -- Return result
  RETURN jsonb_build_object(
    'total_score', v_total_score,
    'max_possible_score', v_max_score,
    'percentage', ROUND(v_percentage, 2),
    'total_items', v_total,
    'responded_items', v_responded,
    'conforming_items', v_conforming,
    'non_conforming_items', v_non_conforming,
    'partial_items', v_partial,
    'na_items', v_na,
    'nc_major_count', v_nc_major,
    'nc_minor_count', v_nc_minor,
    'observation_count', v_obs,
    'opportunity_count', v_opp
  );
END;
$$;