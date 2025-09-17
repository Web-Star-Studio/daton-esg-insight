-- Criar tabelas para relatórios de sustentabilidade GRI

-- Enum para status do relatório
CREATE TYPE report_gri_status_enum AS ENUM ('Rascunho', 'Em Andamento', 'Em Revisão', 'Finalizado', 'Publicado');

-- Enum para tipos de indicadores GRI
CREATE TYPE gri_indicator_type_enum AS ENUM ('Universal', 'Econômico', 'Ambiental', 'Social', 'Governança');

-- Enum para tipos de dados
CREATE TYPE gri_data_type_enum AS ENUM ('Numérico', 'Percentual', 'Texto', 'Booleano', 'Data', 'Anexo');

-- Tabela principal de relatórios GRI
CREATE TABLE public.gri_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT 'Relatório de Sustentabilidade',
    year INTEGER NOT NULL,
    status report_gri_status_enum NOT NULL DEFAULT 'Rascunho',
    gri_standard_version TEXT NOT NULL DEFAULT '2023',
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    publication_date DATE,
    
    -- Metadados do relatório
    executive_summary TEXT,
    ceo_message TEXT,
    methodology TEXT,
    materiality_assessment JSONB DEFAULT '{}',
    stakeholder_engagement JSONB DEFAULT '{}',
    
    -- Configurações
    template_config JSONB DEFAULT '{}',
    completion_percentage INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(company_id, year)
);

-- Tabela de indicadores GRI padrão (base de conhecimento)
CREATE TABLE public.gri_indicators_library (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- Ex: GRI 2-1, GRI 302-1
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    indicator_type gri_indicator_type_enum NOT NULL,
    data_type gri_data_type_enum NOT NULL,
    unit TEXT, -- Ex: kWh, tCO2e, %
    
    -- Metadados do indicador
    gri_standard TEXT NOT NULL, -- Ex: GRI 2, GRI 302
    is_mandatory BOOLEAN DEFAULT false,
    sector_specific BOOLEAN DEFAULT false,
    sectors TEXT[], -- Setores onde se aplica
    
    -- Orientações
    guidance_text TEXT,
    calculation_method TEXT,
    data_sources_suggestions TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dados dos indicadores por relatório
CREATE TABLE public.gri_indicator_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
    
    -- Valores dos dados
    numeric_value NUMERIC,
    text_value TEXT,
    boolean_value BOOLEAN,
    date_value DATE,
    percentage_value NUMERIC,
    
    -- Metadados
    unit TEXT,
    methodology TEXT,
    data_source TEXT,
    verification_level TEXT, -- Ex: 'Auditado', 'Interno', 'Estimado'
    
    -- Documentação de apoio
    supporting_documents UUID[], -- Referencias para documents table
    notes TEXT,
    
    -- Status
    is_complete BOOLEAN DEFAULT false,
    last_updated_by UUID,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(report_id, indicator_id)
);

-- Tabela para seções customizadas do relatório
CREATE TABLE public.gri_report_sections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
    
    section_key TEXT NOT NULL, -- Ex: 'governance', 'environmental', 'social'
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    
    -- Status da seção
    is_complete BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Metadados
    template_used TEXT,
    ai_generated_content BOOLEAN DEFAULT false,
    last_ai_update TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(report_id, section_key)
);

-- Tabela para temas materiais
CREATE TABLE public.materiality_topics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
    
    topic_name TEXT NOT NULL,
    description TEXT,
    significance_level INTEGER, -- 1-5 escala
    stakeholder_importance INTEGER, -- 1-5 escala
    business_impact INTEGER, -- 1-5 escala
    
    -- Indicadores GRI relacionados
    related_indicators UUID[],
    
    -- Gestão do tema
    management_approach TEXT,
    policies_commitments TEXT,
    goals_targets TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para ODS (Objetivos de Desenvolvimento Sustentável)
CREATE TABLE public.sdg_alignment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
    
    sdg_number INTEGER NOT NULL, -- 1-17
    sdg_target TEXT, -- Ex: 3.4, 7.2
    description TEXT,
    contribution_level TEXT, -- 'Alto', 'Médio', 'Baixo'
    
    -- Ações e resultados
    actions_taken TEXT,
    results_achieved TEXT,
    future_commitments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.gri_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicators_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_indicator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gri_report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdg_alignment ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their company GRI reports" 
ON public.gri_reports 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "All users can view GRI indicators library" 
ON public.gri_indicators_library 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert GRI indicators" 
ON public.gri_indicators_library 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can manage their company GRI indicator data" 
ON public.gri_indicator_data 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.gri_reports gr 
    WHERE gr.id = gri_indicator_data.report_id 
    AND gr.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage their company GRI report sections" 
ON public.gri_report_sections 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.gri_reports gr 
    WHERE gr.id = gri_report_sections.report_id 
    AND gr.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage their company materiality topics" 
ON public.materiality_topics 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.gri_reports gr 
    WHERE gr.id = materiality_topics.report_id 
    AND gr.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage their company SDG alignment" 
ON public.sdg_alignment 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.gri_reports gr 
    WHERE gr.id = sdg_alignment.report_id 
    AND gr.company_id = get_user_company_id()
));

-- Triggers para updated_at
CREATE TRIGGER update_gri_reports_updated_at
    BEFORE UPDATE ON public.gri_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gri_indicators_library_updated_at
    BEFORE UPDATE ON public.gri_indicators_library
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gri_indicator_data_updated_at
    BEFORE UPDATE ON public.gri_indicator_data
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gri_report_sections_updated_at
    BEFORE UPDATE ON public.gri_report_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiality_topics_updated_at
    BEFORE UPDATE ON public.materiality_topics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular percentual de conclusão do relatório
CREATE OR REPLACE FUNCTION public.calculate_gri_report_completion(p_report_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    total_indicators INTEGER;
    completed_indicators INTEGER;
    total_sections INTEGER;
    completed_sections INTEGER;
    completion_percentage INTEGER;
BEGIN
    -- Contar indicadores obrigatórios
    SELECT COUNT(*) INTO total_indicators
    FROM public.gri_indicator_data gid
    JOIN public.gri_indicators_library gil ON gid.indicator_id = gil.id
    WHERE gid.report_id = p_report_id AND gil.is_mandatory = true;
    
    -- Contar indicadores obrigatórios completos
    SELECT COUNT(*) INTO completed_indicators
    FROM public.gri_indicator_data gid
    JOIN public.gri_indicators_library gil ON gid.indicator_id = gil.id
    WHERE gid.report_id = p_report_id 
    AND gil.is_mandatory = true 
    AND gid.is_complete = true;
    
    -- Contar seções
    SELECT COUNT(*) INTO total_sections
    FROM public.gri_report_sections
    WHERE report_id = p_report_id;
    
    -- Contar seções completas
    SELECT COUNT(*) INTO completed_sections
    FROM public.gri_report_sections
    WHERE report_id = p_report_id AND is_complete = true;
    
    -- Calcular percentual (50% indicadores + 50% seções)
    IF total_indicators > 0 AND total_sections > 0 THEN
        completion_percentage := ROUND(
            ((completed_indicators::FLOAT / total_indicators) * 50) +
            ((completed_sections::FLOAT / total_sections) * 50)
        );
    ELSIF total_indicators > 0 THEN
        completion_percentage := ROUND((completed_indicators::FLOAT / total_indicators) * 100);
    ELSIF total_sections > 0 THEN
        completion_percentage := ROUND((completed_sections::FLOAT / total_sections) * 100);
    ELSE
        completion_percentage := 0;
    END IF;
    
    -- Atualizar o relatório
    UPDATE public.gri_reports 
    SET completion_percentage = completion_percentage 
    WHERE id = p_report_id;
    
    RETURN completion_percentage;
END;
$$;