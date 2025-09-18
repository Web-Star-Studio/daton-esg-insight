-- Criar tabelas faltantes para sistema completo de materialidade

-- 1. Stakeholder Surveys
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
  status TEXT NOT NULL DEFAULT 'draft',
  total_invitations INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Survey Responses
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL,
  stakeholder_id UUID,
  company_id UUID NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  stakeholder_category TEXT,
  stakeholder_organization TEXT,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Materiality Assessment Steps (para workflow)
CREATE TABLE IF NOT EXISTS public.materiality_assessment_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  configuration JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stakeholder_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_assessment_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their company stakeholder surveys" ON public.stakeholder_surveys
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company survey responses" ON public.survey_responses
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can view public surveys for response" ON public.stakeholder_surveys
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can create survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their company assessment steps" ON public.materiality_assessment_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.materiality_assessments ma 
    WHERE ma.id = materiality_assessment_steps.assessment_id 
    AND ma.company_id = get_user_company_id()
  ));

-- Add foreign keys
ALTER TABLE public.stakeholder_surveys 
  ADD CONSTRAINT stakeholder_surveys_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.materiality_assessments(id) ON DELETE CASCADE;

ALTER TABLE public.survey_responses 
  ADD CONSTRAINT survey_responses_survey_id_fkey 
  FOREIGN KEY (survey_id) REFERENCES public.stakeholder_surveys(id) ON DELETE CASCADE;

ALTER TABLE public.materiality_assessment_steps 
  ADD CONSTRAINT materiality_assessment_steps_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.materiality_assessments(id) ON DELETE CASCADE;

-- Add updated_at triggers
CREATE TRIGGER update_stakeholder_surveys_updated_at
  BEFORE UPDATE ON public.stakeholder_surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON public.survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiality_assessment_steps_updated_at
  BEFORE UPDATE ON public.materiality_assessment_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais de temas de materialidade (se não existirem)
INSERT INTO public.materiality_themes (code, title, description, gri_indicators, category, subcategory, sector_relevance, is_active) VALUES
-- AMBIENTAL
('ENV001', 'Mudanças Climáticas', 'Impactos e riscos relacionados às mudanças climáticas', ARRAY['305-1', '305-2', '305-3', '305-4', '305-5'], 'environmental', 'Clima', ARRAY['all'], true),
('ENV002', 'Gestão de Resíduos', 'Geração, tratamento e destinação de resíduos', ARRAY['306-1', '306-2', '306-3', '306-4', '306-5'], 'environmental', 'Resíduos', ARRAY['all'], true),
('ENV003', 'Uso da Água', 'Consumo e gestão de recursos hídricos', ARRAY['303-1', '303-2', '303-3', '303-4', '303-5'], 'environmental', 'Água', ARRAY['all'], true),
('ENV004', 'Biodiversidade', 'Proteção e impactos na biodiversidade', ARRAY['304-1', '304-2', '304-3', '304-4'], 'environmental', 'Biodiversidade', ARRAY['all'], true),
('ENV005', 'Economia Circular', 'Práticas de economia circular e sustentabilidade', ARRAY['301-1', '301-2', '301-3'], 'environmental', 'Recursos', ARRAY['all'], true),
('ENV006', 'Poluição do Ar', 'Emissões atmosféricas e qualidade do ar', ARRAY['305-6', '305-7'], 'environmental', 'Poluição', ARRAY['industrial', 'energia'], true),
('ENV007', 'Eficiência Energética', 'Consumo e eficiência energética', ARRAY['302-1', '302-2', '302-3', '302-4', '302-5'], 'environmental', 'Energia', ARRAY['all'], true),

-- SOCIAL
('SOC001', 'Saúde e Segurança', 'Saúde e segurança ocupacional dos trabalhadores', ARRAY['403-1', '403-2', '403-3', '403-4', '403-5', '403-6', '403-7', '403-8', '403-9', '403-10'], 'social', 'Trabalhadores', ARRAY['all'], true),
('SOC002', 'Diversidade e Inclusão', 'Diversidade, equidade e inclusão', ARRAY['405-1', '405-2'], 'social', 'Diversidade', ARRAY['all'], true),
('SOC003', 'Desenvolvimento de Talentos', 'Treinamento e desenvolvimento profissional', ARRAY['404-1', '404-2', '404-3'], 'social', 'Capacitação', ARRAY['all'], true),
('SOC004', 'Direitos Humanos', 'Respeito e promoção dos direitos humanos', ARRAY['410-1', '411-1', '412-1', '412-2', '412-3'], 'social', 'Direitos', ARRAY['all'], true),
('SOC005', 'Relacionamento com Comunidades', 'Impactos e engajamento com comunidades locais', ARRAY['413-1', '413-2'], 'social', 'Comunidade', ARRAY['all'], true),
('SOC006', 'Privacidade e Proteção de Dados', 'Proteção de dados pessoais e privacidade', ARRAY['418-1'], 'social', 'Privacidade', ARRAY['tecnologia', 'servicos'], true),
('SOC007', 'Qualidade de Produtos/Serviços', 'Qualidade e segurança de produtos e serviços', ARRAY['416-1', '416-2', '417-1', '417-2'], 'social', 'Qualidade', ARRAY['all'], true),

-- GOVERNANÇA
('GOV001', 'Estrutura de Governança', 'Estrutura e composição dos órgãos de governança', ARRAY['2-9', '2-10', '2-11', '2-12'], 'governance', 'Estrutura', ARRAY['all'], true),
('GOV002', 'Ética e Integridade', 'Práticas éticas e combate à corrupção', ARRAY['2-15', '2-16', '2-17', '205-1', '205-2', '205-3'], 'governance', 'Ética', ARRAY['all'], true),
('GOV003', 'Transparência e Prestação de Contas', 'Transparência na comunicação e prestação de contas', ARRAY['2-2', '2-3', '2-4'], 'governance', 'Transparência', ARRAY['all'], true),
('GOV004', 'Gestão de Riscos', 'Identificação e gestão de riscos ESG', ARRAY['2-12', '2-13'], 'governance', 'Riscos', ARRAY['all'], true),
('GOV005', 'Conformidade Regulatória', 'Cumprimento de leis e regulamentações', ARRAY['2-14', '307-1'], 'governance', 'Compliance', ARRAY['all'], true),
('GOV006', 'Cibersegurança', 'Segurança da informação e cibersegurança', ARRAY['418-1'], 'governance', 'Segurança', ARRAY['tecnologia', 'financeiro'], true),

-- ECONÔMICO
('ECO001', 'Performance Econômica', 'Desempenho econômico e criação de valor', ARRAY['201-1', '201-2', '201-3', '201-4'], 'economic', 'Performance', ARRAY['all'], true),
('ECO002', 'Presença no Mercado', 'Impactos econômicos nos mercados de atuação', ARRAY['202-1', '202-2'], 'economic', 'Mercado', ARRAY['all'], true),
('ECO003', 'Impactos Econômicos Indiretos', 'Impactos econômicos indiretos significativos', ARRAY['203-1', '203-2'], 'economic', 'Impactos', ARRAY['all'], true),
('ECO004', 'Práticas de Compras', 'Sustentabilidade na cadeia de suprimentos', ARRAY['204-1'], 'economic', 'Compras', ARRAY['all'], true),
('ECO005', 'Inovação e Tecnologia', 'Investimentos em inovação e desenvolvimento tecnológico', ARRAY['201-1'], 'economic', 'Inovação', ARRAY['tecnologia', 'industrial'], true),
('ECO006', 'Tributação', 'Estratégia fiscal e transparência tributária', ARRAY['207-1', '207-2', '207-3', '207-4'], 'economic', 'Tributos', ARRAY['all'], true)

ON CONFLICT (code) DO NOTHING;

-- Função para auto-configurar steps de uma avaliação
CREATE OR REPLACE FUNCTION setup_assessment_workflow(assessment_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Inserir os steps padrão do workflow
  INSERT INTO public.materiality_assessment_steps (assessment_id, step_name, step_order, status, configuration) VALUES
    (assessment_id, 'theme_selection', 1, 'pending', '{"description": "Seleção de temas materiais relevantes"}'),
    (assessment_id, 'stakeholder_mapping', 2, 'pending', '{"description": "Mapeamento de stakeholders"}'),
    (assessment_id, 'internal_assessment', 3, 'pending', '{"description": "Avaliação interna de impactos"}'),
    (assessment_id, 'stakeholder_survey', 4, 'pending', '{"description": "Survey com stakeholders"}'),
    (assessment_id, 'matrix_calculation', 5, 'pending', '{"description": "Cálculo da matriz de materialidade"}'),
    (assessment_id, 'report_generation', 6, 'pending', '{"description": "Geração do relatório final"});
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;