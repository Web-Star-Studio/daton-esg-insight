-- Criar tabelas para o Marketplace ESG

-- Tabela de fornecedores/parceiros
CREATE TABLE public.esg_solution_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    location TEXT,
    certifications TEXT[], -- Array de certificações (ISO 14001, etc)
    categories TEXT[], -- waste_management, energy_efficiency, carbon_credits, consulting
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, pending
    rating NUMERIC DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de soluções oferecidas
CREATE TABLE public.esg_solutions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.esg_solution_providers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- waste_management, energy_efficiency, carbon_credits, consulting
    subcategory TEXT, -- recycling, solar_energy, renewable_certificates, etc
    target_problems TEXT[], -- Array de problemas que resolve
    impact_metrics JSONB DEFAULT '{}', -- Métricas de impacto esperado
    pricing_model TEXT, -- fixed, per_unit, subscription, quote_based
    price_range TEXT, -- budget_friendly, mid_range, premium
    implementation_time TEXT, -- 1-3_months, 3-6_months, 6_months_plus
    roi_estimate TEXT, -- 6-12_months, 1-2_years, 2_years_plus
    requirements TEXT[], -- Requisitos mínimos
    case_studies JSONB DEFAULT '[]', -- Estudos de caso
    is_featured BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de leads/interesse de clientes
CREATE TABLE public.marketplace_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    solution_id UUID NOT NULL REFERENCES public.esg_solutions(id) ON DELETE CASCADE,
    insight_reference TEXT, -- Referência ao insight da IA que gerou o lead
    status TEXT NOT NULL DEFAULT 'new', -- new, contacted, quoted, negotiating, closed_won, closed_lost
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    budget_range TEXT,
    timeline TEXT,
    specific_requirements TEXT,
    contact_notes TEXT,
    provider_response TEXT,
    estimated_value NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    contacted_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de reviews/avaliações
CREATE TABLE public.solution_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    solution_id UUID NOT NULL REFERENCES public.esg_solutions(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.esg_solution_providers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    review_text TEXT,
    implementation_success BOOLEAN,
    roi_achieved TEXT,
    would_recommend BOOLEAN DEFAULT true,
    verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.esg_solution_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fornecedores (públicos para leitura)
CREATE POLICY "Anyone can view active providers" ON public.esg_solution_providers
    FOR SELECT USING (status = 'active' AND verified = true);

-- Políticas RLS para soluções (públicas para leitura)
CREATE POLICY "Anyone can view active solutions" ON public.esg_solutions
    FOR SELECT USING (status = 'active');

-- Políticas RLS para leads (apenas da própria empresa)
CREATE POLICY "Users can manage their company leads" ON public.marketplace_leads
    FOR ALL USING (company_id = get_user_company_id());

-- Políticas RLS para reviews (empresas podem criar, todos podem ver)
CREATE POLICY "Users can create reviews for their company" ON public.solution_reviews
    FOR INSERT WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Anyone can view reviews" ON public.solution_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own reviews" ON public.solution_reviews
    FOR UPDATE USING (company_id = get_user_company_id() AND user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_esg_solution_providers_updated_at
    BEFORE UPDATE ON public.esg_solution_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_esg_solutions_updated_at
    BEFORE UPDATE ON public.esg_solutions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_leads_updated_at
    BEFORE UPDATE ON public.marketplace_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_esg_solutions_category ON public.esg_solutions(category);
CREATE INDEX idx_esg_solutions_provider ON public.esg_solutions(provider_id);
CREATE INDEX idx_marketplace_leads_company ON public.marketplace_leads(company_id);
CREATE INDEX idx_marketplace_leads_status ON public.marketplace_leads(status);
CREATE INDEX idx_solution_reviews_solution ON public.solution_reviews(solution_id);

-- Inserir dados de exemplo
INSERT INTO public.esg_solution_providers (company_name, description, contact_email, categories, certifications, verified) VALUES
('EcoWaste Solutions', 'Especialistas em gestão de resíduos e economia circular', 'contato@ecowaste.com.br', ARRAY['waste_management'], ARRAY['ISO 14001', 'ABNT NBR 10004'], true),
('Solar Energy Pro', 'Soluções em energia solar fotovoltaica para empresas', 'vendas@solarenergypro.com.br', ARRAY['energy_efficiency'], ARRAY['CREIA', 'ABSOLAR'], true),
('Carbon Credit Brasil', 'Marketplace de créditos de carbono verificados', 'marketplace@carboncreditbr.com', ARRAY['carbon_credits'], ARRAY['VCS', 'Gold Standard'], true),
('ESG Consulting Group', 'Consultoria especializada em compliance ESG', 'consultoria@esggroup.com.br', ARRAY['consulting'], ARRAY['ISO 26000', 'GRI Standards'], true);

INSERT INTO public.esg_solutions (provider_id, title, description, category, subcategory, target_problems, pricing_model, price_range, implementation_time, roi_estimate) VALUES
((SELECT id FROM public.esg_solution_providers WHERE company_name = 'EcoWaste Solutions'), 
 'Programa de Reciclagem Corporativa', 
 'Implementação completa de programa de reciclagem com coleta seletiva, treinamento e relatórios de impacto',
 'waste_management', 'recycling', 
 ARRAY['baixa_taxa_reciclagem', 'gestao_residuos_ineficiente'], 
 'subscription', 'mid_range', '1-3_months', '6-12_months'),

((SELECT id FROM public.esg_solution_providers WHERE company_name = 'Solar Energy Pro'), 
 'Sistema Solar Fotovoltaico Empresarial', 
 'Instalação de painéis solares com monitoramento em tempo real e manutenção incluída',
 'energy_efficiency', 'solar_energy', 
 ARRAY['alto_consumo_energia_eletrica', 'dependencia_energia_nao_renovavel'], 
 'fixed', 'premium', '3-6_months', '2_years_plus'),

((SELECT id FROM public.esg_solution_providers WHERE company_name = 'Carbon Credit Brasil'), 
 'Créditos de Carbono Verificados', 
 'Portfolio diversificado de créditos de carbono de projetos brasileiros certificados',
 'carbon_credits', 'offset_credits', 
 ARRAY['necessidade_neutralizacao_carbono', 'cumprimento_metas_emissoes'], 
 'per_unit', 'mid_range', '1-3_months', '1-2_years'),

((SELECT id FROM public.esg_solution_providers WHERE company_name = 'ESG Consulting Group'), 
 'Auditoria ESG Completa', 
 'Diagnóstico completo de maturidade ESG com plano de ação e acompanhamento trimestral',
 'consulting', 'esg_audit', 
 ARRAY['baixo_score_esg', 'falta_estrategia_sustentabilidade'], 
 'quote_based', 'premium', '3-6_months', '1-2_years');