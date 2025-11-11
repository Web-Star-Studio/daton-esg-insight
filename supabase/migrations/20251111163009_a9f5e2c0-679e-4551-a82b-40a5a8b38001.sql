-- Add sustainable investment fields to gri_economic_data_collection
-- GRI 201-1, 203-1: Investimentos em Projetos Sustentáveis

ALTER TABLE public.gri_economic_data_collection
  -- Investimentos sustentáveis agregados
  ADD COLUMN IF NOT EXISTS total_sustainable_investment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS capex_sustainable NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS opex_sustainable NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS capex_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS opex_percentage NUMERIC(5,2),
  
  -- Breakdown por categoria ESG
  ADD COLUMN IF NOT EXISTS environmental_investment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS social_investment_calculated NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS governance_investment NUMERIC(15,2),
  
  -- Breakdown por tipo de projeto (JSONB)
  ADD COLUMN IF NOT EXISTS investment_by_project_type JSONB,
  
  -- Contadores
  ADD COLUMN IF NOT EXISTS sustainable_projects_count INTEGER,
  ADD COLUMN IF NOT EXISTS active_sustainable_projects INTEGER,
  ADD COLUMN IF NOT EXISTS completed_sustainable_projects INTEGER,
  
  -- Percentual da receita
  ADD COLUMN IF NOT EXISTS sustainability_investment_percentage_revenue NUMERIC(10,4),
  
  -- Comparação período anterior
  ADD COLUMN IF NOT EXISTS previous_period_sustainable_investment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS investment_growth_percentage NUMERIC(10,2),
  
  -- ROI e benefícios
  ADD COLUMN IF NOT EXISTS estimated_roi_percentage NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS environmental_benefits JSONB,
  ADD COLUMN IF NOT EXISTS social_benefits JSONB,
  
  -- Benchmarks
  ADD COLUMN IF NOT EXISTS sector_avg_investment_percentage NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS is_above_sector_average BOOLEAN,
  
  -- Compliance
  ADD COLUMN IF NOT EXISTS gri_201_1_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS gri_203_1_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS sustainable_investment_missing_data JSONB,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS sustainable_investment_calculation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.gri_economic_data_collection.total_sustainable_investment 
  IS 'GRI 201-1, 203-1: Total de CAPEX + OPEX destinados a projetos com benefícios ambientais ou sociais';

COMMENT ON COLUMN public.gri_economic_data_collection.capex_sustainable 
  IS 'Investimentos de capital (ativos fixos) em projetos ESG';

COMMENT ON COLUMN public.gri_economic_data_collection.opex_sustainable 
  IS 'Investimentos operacionais (despesas) em projetos ESG';

COMMENT ON COLUMN public.gri_economic_data_collection.sustainability_investment_percentage_revenue 
  IS '% da receita investida em sustentabilidade: (Total Investment / Revenue) × 100';

-- Add classification fields to social_projects
ALTER TABLE public.social_projects
  ADD COLUMN IF NOT EXISTS investment_type TEXT CHECK (investment_type IN ('CAPEX', 'OPEX')),
  ADD COLUMN IF NOT EXISTS esg_category TEXT CHECK (esg_category IN ('Ambiental', 'Social', 'Governança'));

COMMENT ON COLUMN public.social_projects.investment_type 
  IS 'Classificação do investimento: CAPEX (capital) ou OPEX (operacional)';

COMMENT ON COLUMN public.social_projects.esg_category 
  IS 'Categoria ESG do projeto: Ambiental, Social ou Governança';

-- Add classification fields to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_esg_project BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS investment_type TEXT CHECK (investment_type IN ('CAPEX', 'OPEX')),
  ADD COLUMN IF NOT EXISTS esg_category TEXT CHECK (esg_category IN ('Ambiental', 'Social', 'Governança'));

COMMENT ON COLUMN public.projects.is_esg_project 
  IS 'Indica se o projeto é classificado como ESG';

COMMENT ON COLUMN public.projects.investment_type 
  IS 'Classificação do investimento: CAPEX (capital) ou OPEX (operacional)';

COMMENT ON COLUMN public.projects.esg_category 
  IS 'Categoria ESG do projeto: Ambiental, Social ou Governança';

-- Add classification fields to carbon_projects
ALTER TABLE public.carbon_projects
  ADD COLUMN IF NOT EXISTS investment_type TEXT CHECK (investment_type IN ('CAPEX', 'OPEX')) DEFAULT 'OPEX',
  ADD COLUMN IF NOT EXISTS esg_category TEXT DEFAULT 'Ambiental';

COMMENT ON COLUMN public.carbon_projects.investment_type 
  IS 'Classificação do investimento: CAPEX (capital) ou OPEX (operacional) - padrão OPEX';

COMMENT ON COLUMN public.carbon_projects.esg_category 
  IS 'Categoria ESG do projeto - padrão Ambiental';