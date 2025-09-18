-- Criar tabelas para o sistema de Materialidade e Stakeholders

-- Tabela de Stakeholders
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('investors', 'employees', 'customers', 'community', 'suppliers', 'regulators', 'ngos', 'media')),
    subcategory TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    organization TEXT,
    position TEXT,
    influence_level TEXT NOT NULL CHECK (influence_level IN ('low', 'medium', 'high')),
    interest_level TEXT NOT NULL CHECK (interest_level IN ('low', 'medium', 'high')),
    engagement_frequency TEXT NOT NULL CHECK (engagement_frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
    preferred_communication TEXT NOT NULL CHECK (preferred_communication IN ('email', 'phone', 'meeting', 'survey')),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Temas de Materialidade
CREATE TABLE IF NOT EXISTS public.materiality_themes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    gri_indicators TEXT[] DEFAULT ARRAY[]::TEXT[],
    category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance', 'economic')),
    subcategory TEXT,
    sector_relevance TEXT[] DEFAULT ARRAY['all']::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Avaliações de Materialidade
CREATE TABLE IF NOT EXISTS public.materiality_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assessment_year INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'survey_open', 'survey_closed', 'analysis', 'completed')) DEFAULT 'draft',
    methodology TEXT,
    selected_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
    stakeholder_participation INTEGER NOT NULL DEFAULT 0,
    internal_score JSONB NOT NULL DEFAULT '{}'::jsonb,
    external_score JSONB NOT NULL DEFAULT '{}'::jsonb,
    final_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_summary TEXT,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Surveys para Stakeholders
CREATE TABLE IF NOT EXISTS public.stakeholder_surveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID NOT NULL,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    survey_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_stakeholder_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    response_deadline TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
    total_invitations INTEGER NOT NULL DEFAULT 0,
    total_responses INTEGER NOT NULL DEFAULT 0,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Respostas de Survey
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID NOT NULL,
    stakeholder_id UUID,
    company_id UUID NOT NULL,
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    stakeholder_category TEXT,
    stakeholder_organization TEXT,
    completion_percentage NUMERIC NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_stakeholders_company_id ON public.stakeholders(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_category ON public.stakeholders(category);
CREATE INDEX IF NOT EXISTS idx_materiality_themes_category ON public.materiality_themes(category);
CREATE INDEX IF NOT EXISTS idx_materiality_assessments_company_id ON public.materiality_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_surveys_assessment_id ON public.stakeholder_surveys(assessment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Stakeholders
CREATE POLICY "Users can manage stakeholders from their company" ON public.stakeholders
    FOR ALL USING (company_id = get_user_company_id());

-- Políticas RLS para Temas de Materialidade (visível para todos usuários autenticados)
CREATE POLICY "All authenticated users can view materiality themes" ON public.materiality_themes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas RLS para Avaliações de Materialidade
CREATE POLICY "Users can manage materiality assessments from their company" ON public.materiality_assessments
    FOR ALL USING (company_id = get_user_company_id());

-- Políticas RLS para Surveys de Stakeholders
CREATE POLICY "Users can manage stakeholder surveys from their company" ON public.stakeholder_surveys
    FOR ALL USING (company_id = get_user_company_id());

-- Políticas RLS para Respostas de Survey
CREATE POLICY "Users can manage survey responses from their company" ON public.survey_responses
    FOR ALL USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_stakeholders_updated_at
    BEFORE UPDATE ON public.stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiality_themes_updated_at
    BEFORE UPDATE ON public.materiality_themes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiality_assessments_updated_at
    BEFORE UPDATE ON public.materiality_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stakeholder_surveys_updated_at
    BEFORE UPDATE ON public.stakeholder_surveys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
    BEFORE UPDATE ON public.survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();