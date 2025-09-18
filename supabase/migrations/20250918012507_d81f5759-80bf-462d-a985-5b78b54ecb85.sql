-- Criar tabelas para sistema inteligente de indicadores GRI

-- Tabela para mapeamento de dados existentes com indicadores GRI
CREATE TABLE public.gri_indicator_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
  source_table TEXT NOT NULL,
  source_column TEXT NOT NULL,
  mapping_formula TEXT, -- Fórmula para cálculo quando necessário
  mapping_type TEXT NOT NULL DEFAULT 'direct', -- direct, calculated, aggregated
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para metas e objetivos por indicador
CREATE TABLE public.gri_indicator_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
  target_year INTEGER NOT NULL,
  target_value NUMERIC,
  target_description TEXT,
  baseline_value NUMERIC,
  baseline_year INTEGER,
  progress_tracking JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para benchmarks setoriais
CREATE TABLE public.gri_indicator_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
  sector TEXT NOT NULL,
  region TEXT DEFAULT 'Brasil',
  benchmark_value NUMERIC,
  benchmark_range_min NUMERIC,
  benchmark_range_max NUMERIC,
  data_source TEXT,
  reference_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para regras de validação personalizadas
CREATE TABLE public.gri_data_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
  validation_rule JSONB NOT NULL,
  error_message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de preenchimento dos indicadores
CREATE TABLE public.gri_indicator_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  indicator_data_id UUID NOT NULL REFERENCES public.gri_indicator_data(id),
  previous_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  changed_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para evidências e documentos dos indicadores
CREATE TABLE public.gri_indicator_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  indicator_data_id UUID NOT NULL REFERENCES public.gri_indicator_data(id),
  document_id UUID REFERENCES public.documents(id),
  evidence_type TEXT NOT NULL, -- document, calculation, external_source
  evidence_description TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.gri_indicator_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicator_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicator_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_data_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicator_evidence ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their company indicator mappings" 
ON public.gri_indicator_mappings 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company indicator targets" 
ON public.gri_indicator_targets 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "All authenticated users can view benchmarks" 
ON public.gri_indicator_benchmarks 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their company data validations" 
ON public.gri_data_validations 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company indicator history" 
ON public.gri_indicator_history 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company indicator evidence" 
ON public.gri_indicator_evidence 
FOR ALL 
USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_gri_indicator_mappings_updated_at
BEFORE UPDATE ON public.gri_indicator_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gri_indicator_targets_updated_at
BEFORE UPDATE ON public.gri_indicator_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para buscar dados automaticamente para indicadores
CREATE OR REPLACE FUNCTION public.get_indicator_suggested_value(
  p_company_id UUID,
  p_indicator_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB := '{}';
  emission_data NUMERIC;
  energy_data NUMERIC;
BEGIN
  -- GRI 305-1: Emissões diretas (Escopo 1)
  IF p_indicator_code = '305-1' THEN
    SELECT COALESCE(SUM(ce.total_co2e), 0)
    INTO emission_data
    FROM calculated_emissions ce
    JOIN activity_data ad ON ce.activity_data_id = ad.id
    JOIN emission_sources es ON ad.emission_source_id = es.id
    WHERE es.company_id = p_company_id 
    AND es.scope = 1
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', emission_data,
      'unit', 'tCO2e',
      'data_source', 'calculated_emissions',
      'confidence', CASE WHEN emission_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 305-2: Emissões indiretas de energia (Escopo 2)
  IF p_indicator_code = '305-2' THEN
    SELECT COALESCE(SUM(ce.total_co2e), 0)
    INTO emission_data
    FROM calculated_emissions ce
    JOIN activity_data ad ON ce.activity_data_id = ad.id
    JOIN emission_sources es ON ad.emission_source_id = es.id
    WHERE es.company_id = p_company_id 
    AND es.scope = 2
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', emission_data,
      'unit', 'tCO2e',
      'data_source', 'calculated_emissions',
      'confidence', CASE WHEN emission_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 302-1: Consumo de energia dentro da organização
  IF p_indicator_code = '302-1' THEN
    SELECT COALESCE(SUM(ad.quantity), 0)
    INTO energy_data
    FROM activity_data ad
    JOIN emission_sources es ON ad.emission_source_id = es.id
    JOIN emission_factors ef ON ad.emission_factor_id = ef.id
    WHERE es.company_id = p_company_id 
    AND ef.category ILIKE '%energia%'
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', energy_data,
      'unit', 'GJ',
      'data_source', 'activity_data',
      'confidence', CASE WHEN energy_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  RETURN result;
END;
$$;