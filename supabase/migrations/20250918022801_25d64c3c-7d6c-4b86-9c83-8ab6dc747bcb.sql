-- Verificar e criar apenas as tabelas que não existem

-- Tabela de Stakeholders (verificar se existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stakeholders') THEN
        CREATE TABLE public.stakeholders (
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
        
        ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage stakeholders from their company" ON public.stakeholders
            FOR ALL USING (company_id = get_user_company_id());
            
        CREATE TRIGGER update_stakeholders_updated_at
            BEFORE UPDATE ON public.stakeholders
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Tabela de Temas de Materialidade (verificar se existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materiality_themes') THEN
        CREATE TABLE public.materiality_themes (
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
        
        ALTER TABLE public.materiality_themes ENABLE ROW LEVEL SECURITY;
        
        CREATE TRIGGER update_materiality_themes_updated_at
            BEFORE UPDATE ON public.materiality_themes
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Tabela de Avaliações de Materialidade (verificar se existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materiality_assessments') THEN
        CREATE TABLE public.materiality_assessments (
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
        
        ALTER TABLE public.materiality_assessments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage materiality assessments from their company" ON public.materiality_assessments
            FOR ALL USING (company_id = get_user_company_id());
            
        CREATE TRIGGER update_materiality_assessments_updated_at
            BEFORE UPDATE ON public.materiality_assessments
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Inserir alguns temas de materialidade padrão
INSERT INTO public.materiality_themes (code, title, description, category, gri_indicators, sector_relevance) VALUES
('ENV-001', 'Emissões de GEE', 'Emissões diretas e indiretas de gases de efeito estufa', 'environmental', ARRAY['305-1', '305-2', '305-3'], ARRAY['all']),
('ENV-002', 'Gestão de Água', 'Uso, tratamento e descarte de recursos hídricos', 'environmental', ARRAY['303-1', '303-2', '303-3'], ARRAY['all']),
('ENV-003', 'Gestão de Resíduos', 'Geração, tratamento e destinação de resíduos', 'environmental', ARRAY['306-1', '306-2', '306-3'], ARRAY['all']),
('SOC-001', 'Saúde e Segurança', 'Condições de trabalho e bem-estar dos colaboradores', 'social', ARRAY['403-1', '403-2', '403-9'], ARRAY['all']),
('SOC-002', 'Diversidade e Inclusão', 'Igualdade de oportunidades e diversidade no ambiente de trabalho', 'social', ARRAY['405-1', '405-2'], ARRAY['all']),
('GOV-001', 'Ética e Anticorrupção', 'Práticas éticas e prevenção à corrupção', 'governance', ARRAY['205-1', '205-2', '205-3'], ARRAY['all']),
('GOV-002', 'Gestão de Riscos', 'Identificação e mitigação de riscos empresariais', 'governance', ARRAY['102-11', '102-15'], ARRAY['all']),
('ECO-001', 'Performance Econômica', 'Valor econômico gerado e distribuído', 'economic', ARRAY['201-1', '201-4'], ARRAY['all'])
ON CONFLICT (code) DO NOTHING;