-- Criar apenas tabelas que não existem
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, 
    probability TEXT NOT NULL CHECK (probability IN ('Baixa', 'Média', 'Alta')),
    impact TEXT NOT NULL CHECK (impact IN ('Baixo', 'Médio', 'Alto')),
    opportunity_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN probability = 'Alta' AND impact = 'Alto' THEN 'Crítica'
            WHEN (probability = 'Alta' AND impact = 'Médio') OR (probability = 'Média' AND impact = 'Alto') THEN 'Alta'
            WHEN (probability = 'Alta' AND impact = 'Baixo') OR (probability = 'Média' AND impact = 'Médio') OR (probability = 'Baixa' AND impact = 'Alto') THEN 'Média'
            WHEN (probability = 'Média' AND impact = 'Baixo') OR (probability = 'Baixa' AND impact = 'Médio') THEN 'Baixa'
            ELSE 'Muito Baixa'
        END
    ) STORED,
    status TEXT NOT NULL DEFAULT 'Identificada' CHECK (status IN ('Identificada', 'Em Análise', 'Em Implementação', 'Implementada', 'Descartada')),
    responsible_user_id UUID,
    identification_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    potential_value NUMERIC,
    implementation_cost NUMERIC,
    roi_estimate NUMERIC,
    mitigation_actions TEXT,
    monitoring_indicators TEXT,
    review_date DATE,
    next_review_date DATE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.risk_occurrences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    risk_id UUID NOT NULL,
    occurrence_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    actual_impact TEXT NOT NULL CHECK (actual_impact IN ('Baixo', 'Médio', 'Alto')),
    financial_impact NUMERIC,
    operational_impact TEXT,
    response_actions TEXT,
    lessons_learned TEXT,
    status TEXT NOT NULL DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Em Tratamento', 'Resolvida', 'Fechada')),
    responsible_user_id UUID,
    resolution_date DATE,
    prevention_measures TEXT,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para verificar se a política existe
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS e criar políticas apenas se não existirem
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.risk_occurrences ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas apenas se não existirem
    IF NOT policy_exists('opportunities', 'Users can manage their company opportunities') THEN
        CREATE POLICY "Users can manage their company opportunities" 
        ON public.opportunities 
        FOR ALL 
        USING (company_id = get_user_company_id());
    END IF;
    
    IF NOT policy_exists('risk_occurrences', 'Users can manage their company risk occurrences') THEN
        CREATE POLICY "Users can manage their company risk occurrences" 
        ON public.risk_occurrences 
        FOR ALL 
        USING (company_id = get_user_company_id());
    END IF;
END $$;

-- Criar função de estatísticas
CREATE OR REPLACE FUNCTION public.calculate_risk_management_stats(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_risks INTEGER;
    critical_risks INTEGER;
    opportunities_count INTEGER;
    occurrences_count INTEGER;
    treatments_active INTEGER;
BEGIN
    -- Contar riscos por nível
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE inherent_risk_level = 'Crítico') as critical
    INTO total_risks, critical_risks
    FROM public.esg_risks 
    WHERE company_id = p_company_id AND status = 'Ativo';
    
    -- Contar oportunidades
    SELECT COUNT(*) INTO opportunities_count
    FROM public.opportunities 
    WHERE company_id = p_company_id AND status IN ('Identificada', 'Em Análise', 'Em Implementação');
    
    -- Contar ocorrências no último ano
    SELECT COUNT(*) INTO occurrences_count
    FROM public.risk_occurrences 
    WHERE company_id = p_company_id 
    AND occurrence_date >= CURRENT_DATE - INTERVAL '1 year';
    
    result := jsonb_build_object(
        'total_risks', total_risks,
        'critical_risks', critical_risks,
        'opportunities_count', opportunities_count,
        'occurrences_count', occurrences_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;