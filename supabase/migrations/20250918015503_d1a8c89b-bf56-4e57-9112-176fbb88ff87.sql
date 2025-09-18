-- Expandir tabela companies com novos campos organizacionais
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS legal_structure TEXT,
ADD COLUMN IF NOT EXISTS governance_model TEXT,
ADD COLUMN IF NOT EXISTS headquarters_address TEXT,
ADD COLUMN IF NOT EXISTS headquarters_country TEXT,
ADD COLUMN IF NOT EXISTS headquarters_coordinates JSONB,
ADD COLUMN IF NOT EXISTS business_units JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subsidiaries_included JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subsidiaries_excluded JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reporting_scope TEXT,
ADD COLUMN IF NOT EXISTS fiscal_year_start DATE,
ADD COLUMN IF NOT EXISTS fiscal_year_end DATE,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS stock_exchange TEXT,
ADD COLUMN IF NOT EXISTS stock_symbol TEXT;

-- Criar tabela de stakeholders
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'investors', 'employees', 'customers', 'community', 'suppliers', 'regulators', 'ngos', 'media'
  subcategory TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  organization TEXT,
  position TEXT,
  influence_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  interest_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  engagement_frequency TEXT DEFAULT 'annual', -- 'monthly', 'quarterly', 'biannual', 'annual'
  preferred_communication TEXT DEFAULT 'email', -- 'email', 'phone', 'meeting', 'survey'
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para stakeholders
CREATE INDEX IF NOT EXISTS idx_stakeholders_company_id ON public.stakeholders(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_category ON public.stakeholders(category);

-- Criar tabela de temas de materialidade
CREATE TABLE IF NOT EXISTS public.materiality_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  gri_indicators TEXT[], -- Array de códigos GRI relacionados
  category TEXT NOT NULL, -- 'environmental', 'social', 'governance', 'economic'
  subcategory TEXT,
  sector_relevance TEXT[], -- Array de setores onde é mais relevante
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de avaliações de materialidade
CREATE TABLE IF NOT EXISTS public.materiality_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'survey_open', 'survey_closed', 'analysis', 'completed'
  methodology TEXT,
  selected_themes JSONB DEFAULT '[]'::jsonb, -- Array de theme IDs selecionados
  stakeholder_participation INTEGER DEFAULT 0,
  internal_score JSONB DEFAULT '{}'::jsonb, -- Scores internos por tema
  external_score JSONB DEFAULT '{}'::jsonb, -- Scores externos por tema
  final_matrix JSONB DEFAULT '{}'::jsonb, -- Matriz final de materialidade
  report_summary TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para avaliações de materialidade
CREATE INDEX IF NOT EXISTS idx_materiality_assessments_company_id ON public.materiality_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_materiality_assessments_year ON public.materiality_assessments(assessment_year);

-- Criar tabela de surveys de stakeholders
CREATE TABLE IF NOT EXISTS public.stakeholder_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  survey_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configuração do questionário
  target_stakeholder_categories TEXT[], -- Categorias de stakeholders alvo
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  response_deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'closed'
  total_invitations INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para surveys
CREATE INDEX IF NOT EXISTS idx_stakeholder_surveys_assessment_id ON public.stakeholder_surveys(assessment_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_surveys_company_id ON public.stakeholder_surveys(company_id);

-- Criar tabela de respostas de surveys
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL,
  stakeholder_id UUID, -- Pode ser NULL se survey for anônimo
  company_id UUID NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Respostas do questionário
  stakeholder_category TEXT, -- Categoria para surveys anônimos
  stakeholder_organization TEXT, -- Organização para surveys anônimos
  completion_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para respostas
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_stakeholder_id ON public.survey_responses(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_company_id ON public.survey_responses(company_id);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stakeholders
CREATE POLICY "Users can manage their company stakeholders" 
ON public.stakeholders 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para temas de materialidade (visível para todos os usuários autenticados)
CREATE POLICY "All authenticated users can view materiality themes" 
ON public.materiality_themes 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Políticas RLS para avaliações de materialidade
CREATE POLICY "Users can manage their company materiality assessments" 
ON public.materiality_assessments 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para surveys
CREATE POLICY "Users can manage their company surveys" 
ON public.stakeholder_surveys 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para respostas (usuários podem ver suas respostas, empresas podem ver respostas de seus surveys)
CREATE POLICY "Users can view their company survey responses" 
ON public.survey_responses 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create survey responses" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (true); -- Permitir inserção para surveys públicos

-- Trigger para updated_at
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

-- Inserir temas de materialidade padrão baseados nos padrões GRI
INSERT INTO public.materiality_themes (code, title, description, gri_indicators, category, subcategory, sector_relevance) VALUES
-- Temas Ambientais (GRI 300)
('ENV-001', 'Mudanças Climáticas e Emissões de GEE', 'Gestão de emissões de gases de efeito estufa e estratégias de mitigação às mudanças climáticas', ARRAY['305-1', '305-2', '305-3', '305-4', '305-5'], 'environmental', 'climate', ARRAY['all']),
('ENV-002', 'Gestão de Água e Efluentes', 'Consumo, reutilização e qualidade da água, tratamento de efluentes', ARRAY['303-1', '303-2', '303-3', '303-4', '303-5'], 'environmental', 'water', ARRAY['manufacturing', 'mining', 'agriculture', 'textiles']),
('ENV-003', 'Gestão de Resíduos', 'Geração, tratamento e destinação de resíduos sólidos e perigosos', ARRAY['306-1', '306-2', '306-3', '306-4', '306-5'], 'environmental', 'waste', ARRAY['all']),
('ENV-004', 'Biodiversidade e Ecossistemas', 'Impactos na biodiversidade, conservação e restauração ambiental', ARRAY['304-1', '304-2', '304-3', '304-4'], 'environmental', 'biodiversity', ARRAY['mining', 'oil_gas', 'agriculture', 'forestry']),
('ENV-005', 'Eficiência Energética', 'Consumo de energia, energia renovável e eficiência energética', ARRAY['302-1', '302-2', '302-3', '302-4', '302-5'], 'environmental', 'energy', ARRAY['all']),
('ENV-006', 'Materiais e Economia Circular', 'Uso de materiais, reciclagem e princípios de economia circular', ARRAY['301-1', '301-2', '301-3'], 'environmental', 'materials', ARRAY['manufacturing', 'construction', 'textiles']),

-- Temas Sociais (GRI 400)
('SOC-001', 'Saúde e Segurança no Trabalho', 'Prevenção de acidentes, doenças ocupacionais e bem-estar dos trabalhadores', ARRAY['403-1', '403-2', '403-3', '403-4', '403-5', '403-6', '403-7', '403-8', '403-9', '403-10'], 'social', 'workplace', ARRAY['all']),
('SOC-002', 'Diversidade, Equidade e Inclusão', 'Diversidade na força de trabalho, equidade salarial e inclusão', ARRAY['405-1', '405-2'], 'social', 'diversity', ARRAY['all']),
('SOC-003', 'Desenvolvimento e Treinamento', 'Capacitação profissional, desenvolvimento de carreira e educação', ARRAY['404-1', '404-2', '404-3'], 'social', 'development', ARRAY['all']),
('SOC-004', 'Direitos Humanos', 'Respeito aos direitos humanos na operação e cadeia de suprimentos', ARRAY['411-1', '412-1', '412-2', '412-3'], 'social', 'human_rights', ARRAY['all']),
('SOC-005', 'Relações Trabalhistas', 'Liberdade de associação, negociação coletiva e diálogo social', ARRAY['407-1', '402-1'], 'social', 'labor_relations', ARRAY['all']),
('SOC-006', 'Desenvolvimento Comunitário', 'Impactos e investimentos nas comunidades locais', ARRAY['413-1', '413-2'], 'social', 'community', ARRAY['all']),
('SOC-007', 'Responsabilidade pelo Produto', 'Segurança, qualidade e informações sobre produtos e serviços', ARRAY['416-1', '416-2', '417-1', '417-2', '417-3'], 'social', 'product', ARRAY['manufacturing', 'pharmaceutical', 'food_beverage']),

-- Temas de Governança (GRI 200)
('GOV-001', 'Ética e Integridade', 'Código de conduta, prevenção à corrupção e cultura ética', ARRAY['205-1', '205-2', '205-3'], 'governance', 'ethics', ARRAY['all']),
('GOV-002', 'Governança Corporativa', 'Estrutura de governança, transparência e responsabilidade', ARRAY['102-18', '102-19', '102-20'], 'governance', 'corporate', ARRAY['all']),
('GOV-003', 'Gestão de Riscos', 'Identificação, avaliação e mitigação de riscos ESG', ARRAY['102-15', '102-30'], 'governance', 'risk', ARRAY['all']),
('GOV-004', 'Transparência e Prestação de Contas', 'Divulgação de informações e relacionamento com stakeholders', ARRAY['102-40', '102-42', '102-43', '102-44'], 'governance', 'transparency', ARRAY['all']),
('GOV-005', 'Privacidade e Proteção de Dados', 'Segurança da informação e proteção de dados pessoais', ARRAY['418-1'], 'governance', 'privacy', ARRAY['technology', 'financial', 'healthcare']),

-- Temas Econômicos
('ECO-001', 'Performance Econômica', 'Geração e distribuição de valor econômico', ARRAY['201-1', '201-2', '201-3', '201-4'], 'economic', 'performance', ARRAY['all']),
('ECO-002', 'Práticas de Compras', 'Cadeia de suprimentos responsável e compras locais', ARRAY['204-1'], 'economic', 'procurement', ARRAY['all']),
('ECO-003', 'Inovação e Sustentabilidade', 'Investimentos em P&D sustentável e inovação', ARRAY['201-1'], 'economic', 'innovation', ARRAY['technology', 'pharmaceutical', 'manufacturing']);