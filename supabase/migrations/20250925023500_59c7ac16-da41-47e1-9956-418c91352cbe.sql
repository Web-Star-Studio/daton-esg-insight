-- MÓDULO INDICADORES SGQ - Sistema de Gestão da Qualidade

-- Tabela principal de indicadores de qualidade
CREATE TABLE public.quality_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Qualidade', 'Produtividade', 'Satisfação', etc
    measurement_unit TEXT NOT NULL,
    measurement_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'automatic', 'calculated'
    calculation_formula TEXT, -- Para indicadores calculados
    frequency TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly'
    responsible_user_id UUID,
    data_source TEXT, -- Fonte dos dados
    collection_method TEXT, -- Método de coleta
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de metas e limites dos indicadores
CREATE TABLE public.indicator_targets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
    target_value NUMERIC NOT NULL,
    upper_limit NUMERIC, -- Limite superior de alerta
    lower_limit NUMERIC, -- Limite inferior de alerta
    critical_upper_limit NUMERIC, -- Limite crítico superior
    critical_lower_limit NUMERIC, -- Limite crítico inferior
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de medições dos indicadores
CREATE TABLE public.indicator_measurements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    measured_value NUMERIC NOT NULL,
    measurement_period_start DATE,
    measurement_period_end DATE,
    data_source_reference TEXT, -- Referência da fonte dos dados
    collected_by_user_id UUID,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'invalid', 'under_review'
    deviation_level TEXT, -- 'none', 'warning', 'critical'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de análises críticas dos indicadores
CREATE TABLE public.indicator_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    analysis_type TEXT NOT NULL, -- 'periodic', 'deviation', 'root_cause'
    trigger_measurement_id UUID REFERENCES public.indicator_measurements(id),
    deviation_description TEXT,
    root_cause_analysis JSONB, -- Estrutura para 5 Porquês, Ishikawa, etc
    corrective_actions JSONB, -- Array de ações corretivas
    preventive_actions JSONB, -- Array de ações preventivas
    analysis_conclusion TEXT,
    analyzed_by_user_id UUID NOT NULL,
    approved_by_user_id UUID,
    approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approval_date TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    effectiveness_verification_date DATE,
    effectiveness_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de alertas de desvios
CREATE TABLE public.indicator_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
    measurement_id UUID NOT NULL REFERENCES public.indicator_measurements(id) ON DELETE CASCADE,
    alert_level TEXT NOT NULL, -- 'warning', 'critical'
    alert_type TEXT NOT NULL, -- 'upper_limit', 'lower_limit', 'trend'
    alert_message TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by_user_id UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by_user_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ocorrências relacionadas aos indicadores
CREATE TABLE public.indicator_occurrences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    indicator_id UUID REFERENCES public.quality_indicators(id),
    occurrence_date DATE NOT NULL,
    occurrence_type TEXT NOT NULL, -- 'deviation', 'improvement', 'issue'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    impact_description TEXT,
    immediate_actions TEXT,
    responsible_user_id UUID,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    resolution_date DATE,
    resolution_description TEXT,
    lessons_learned TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_quality_indicators_company ON public.quality_indicators(company_id);
CREATE INDEX idx_quality_indicators_category ON public.quality_indicators(category);
CREATE INDEX idx_indicator_measurements_indicator ON public.indicator_measurements(indicator_id);
CREATE INDEX idx_indicator_measurements_date ON public.indicator_measurements(measurement_date);
CREATE INDEX idx_indicator_analysis_indicator ON public.indicator_analysis(indicator_id);
CREATE INDEX idx_indicator_alerts_indicator ON public.indicator_alerts(indicator_id);
CREATE INDEX idx_indicator_occurrences_company ON public.indicator_occurrences(company_id);

-- Habilitar RLS
ALTER TABLE public.quality_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_occurrences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quality_indicators
CREATE POLICY "Users can manage their company quality indicators" 
ON public.quality_indicators 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para indicator_targets
CREATE POLICY "Users can manage targets from their company indicators" 
ON public.indicator_targets 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.quality_indicators qi 
    WHERE qi.id = indicator_targets.indicator_id 
    AND qi.company_id = get_user_company_id()
));

-- Políticas RLS para indicator_measurements
CREATE POLICY "Users can manage measurements from their company indicators" 
ON public.indicator_measurements 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.quality_indicators qi 
    WHERE qi.id = indicator_measurements.indicator_id 
    AND qi.company_id = get_user_company_id()
));

-- Políticas RLS para indicator_analysis
CREATE POLICY "Users can manage analysis from their company indicators" 
ON public.indicator_analysis 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.quality_indicators qi 
    WHERE qi.id = indicator_analysis.indicator_id 
    AND qi.company_id = get_user_company_id()
));

-- Políticas RLS para indicator_alerts
CREATE POLICY "Users can manage alerts from their company indicators" 
ON public.indicator_alerts 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.quality_indicators qi 
    WHERE qi.id = indicator_alerts.indicator_id 
    AND qi.company_id = get_user_company_id()
));

-- Políticas RLS para indicator_occurrences
CREATE POLICY "Users can manage their company indicator occurrences" 
ON public.indicator_occurrences 
FOR ALL 
USING (company_id = get_user_company_id());

-- Função para calcular desvio do indicador
CREATE OR REPLACE FUNCTION public.calculate_indicator_deviation(
    p_measured_value NUMERIC,
    p_target_value NUMERIC,
    p_upper_limit NUMERIC,
    p_lower_limit NUMERIC,
    p_critical_upper_limit NUMERIC,
    p_critical_lower_limit NUMERIC
) 
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Verificar limites críticos
    IF p_critical_upper_limit IS NOT NULL AND p_measured_value > p_critical_upper_limit THEN
        RETURN 'critical';
    END IF;
    
    IF p_critical_lower_limit IS NOT NULL AND p_measured_value < p_critical_lower_limit THEN
        RETURN 'critical';
    END IF;
    
    -- Verificar limites de alerta
    IF p_upper_limit IS NOT NULL AND p_measured_value > p_upper_limit THEN
        RETURN 'warning';
    END IF;
    
    IF p_lower_limit IS NOT NULL AND p_measured_value < p_lower_limit THEN
        RETURN 'warning';
    END IF;
    
    RETURN 'none';
END;
$$;

-- Trigger para calcular desvio automaticamente nas medições
CREATE OR REPLACE FUNCTION public.update_measurement_deviation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    target_record RECORD;
BEGIN
    -- Buscar meta ativa para o indicador
    SELECT target_value, upper_limit, lower_limit, critical_upper_limit, critical_lower_limit 
    INTO target_record
    FROM public.indicator_targets 
    WHERE indicator_id = NEW.indicator_id 
    AND is_active = true 
    AND valid_from <= NEW.measurement_date 
    AND (valid_until IS NULL OR valid_until >= NEW.measurement_date)
    ORDER BY valid_from DESC 
    LIMIT 1;
    
    IF target_record IS NOT NULL THEN
        NEW.deviation_level := calculate_indicator_deviation(
            NEW.measured_value,
            target_record.target_value,
            target_record.upper_limit,
            target_record.lower_limit,
            target_record.critical_upper_limit,
            target_record.critical_lower_limit
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_indicator_measurement_deviation
    BEFORE INSERT OR UPDATE ON public.indicator_measurements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_measurement_deviation();

-- Trigger para criar alertas automáticos
CREATE OR REPLACE FUNCTION public.create_automatic_alerts()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Criar alerta se houver desvio
    IF NEW.deviation_level IN ('warning', 'critical') THEN
        INSERT INTO public.indicator_alerts (
            indicator_id,
            measurement_id,
            alert_level,
            alert_type,
            alert_message
        ) VALUES (
            NEW.indicator_id,
            NEW.id,
            NEW.deviation_level,
            CASE 
                WHEN NEW.measured_value > (SELECT target_value FROM public.indicator_targets WHERE indicator_id = NEW.indicator_id AND is_active = true LIMIT 1) 
                THEN 'upper_limit'
                ELSE 'lower_limit'
            END,
            CASE NEW.deviation_level
                WHEN 'warning' THEN 'Indicador fora dos limites de alerta'
                WHEN 'critical' THEN 'Indicador em nível crítico - ação imediata necessária'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_indicator_alerts
    AFTER INSERT OR UPDATE ON public.indicator_measurements
    FOR EACH ROW
    EXECUTE FUNCTION public.create_automatic_alerts();

-- Função para calcular estatísticas do indicador
CREATE OR REPLACE FUNCTION public.calculate_indicator_statistics(
    p_indicator_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    avg_value NUMERIC;
    min_value NUMERIC;
    max_value NUMERIC;
    std_dev NUMERIC;
    measurement_count INTEGER;
    trend_slope NUMERIC;
BEGIN
    -- Calcular estatísticas básicas
    SELECT 
        AVG(measured_value),
        MIN(measured_value),
        MAX(measured_value),
        STDDEV(measured_value),
        COUNT(*)
    INTO avg_value, min_value, max_value, std_dev, measurement_count
    FROM public.indicator_measurements
    WHERE indicator_id = p_indicator_id
    AND status = 'valid'
    AND (p_start_date IS NULL OR measurement_date >= p_start_date)
    AND (p_end_date IS NULL OR measurement_date <= p_end_date);
    
    -- Construir resultado
    result := jsonb_build_object(
        'average', COALESCE(avg_value, 0),
        'minimum', COALESCE(min_value, 0),
        'maximum', COALESCE(max_value, 0),
        'standard_deviation', COALESCE(std_dev, 0),
        'measurement_count', COALESCE(measurement_count, 0),
        'coefficient_variation', CASE 
            WHEN avg_value > 0 THEN COALESCE(std_dev / avg_value * 100, 0)
            ELSE 0 
        END
    );
    
    RETURN result;
END;
$$;