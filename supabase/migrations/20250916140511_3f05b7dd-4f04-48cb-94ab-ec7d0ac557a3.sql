-- Adicionar novas categorias de Escopo 3 e metodologias específicas

-- 1. Criar tabela para fatores variáveis brasileiros (% biodiesel, etanol mensal)
CREATE TABLE public.variable_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  biodiesel_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  ethanol_percentage NUMERIC(5,2) NOT NULL DEFAULT 27.0,
  electricity_sin_factor NUMERIC(10,6), -- fator de emissão mensal SIN
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

-- 2. Criar tabela para metodologias específicas de solo
CREATE TABLE public.land_use_change (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  area_hectares NUMERIC(12,2) NOT NULL,
  previous_use TEXT NOT NULL, -- floresta, pastagem, agricultura, etc.
  current_use TEXT NOT NULL,
  vegetation_type TEXT, -- primária, secundária
  carbon_stock_before NUMERIC(12,2), -- tC/ha
  carbon_stock_after NUMERIC(12,2), -- tC/ha
  change_year INTEGER NOT NULL,
  location_state TEXT,
  climate_zone TEXT, -- tropical, temperado, etc.
  calculation_method TEXT DEFAULT 'ipcc_tier1',
  co2_emissions NUMERIC(15,2), -- resultado calculado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela para tratamento de efluentes específico
CREATE TABLE public.wastewater_treatment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  treatment_type TEXT NOT NULL, -- aeróbico, anaeróbico, lodo ativado, etc.
  organic_load_bod NUMERIC(12,2), -- DBO em kg/ano
  nitrogen_content NUMERIC(12,2), -- N em kg/ano
  volume_treated NUMERIC(15,2), -- m³/ano
  temperature NUMERIC(5,2), -- temperatura média °C
  sludge_removed BOOLEAN DEFAULT false,
  methane_recovered BOOLEAN DEFAULT false,
  discharge_pathway TEXT, -- rio, mar, tratamento municipal, etc.
  ch4_emissions NUMERIC(15,2), -- kg CH4/ano
  n2o_emissions NUMERIC(15,2), -- kg N2O/ano
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Expandir categorias de Escopo 3
-- Atualizar a estrutura de emission_sources para incluir subcategorias
ALTER TABLE public.emission_sources 
ADD COLUMN subcategory TEXT,
ADD COLUMN scope_3_category_number INTEGER;

-- 5. Criar tabela para transporte upstream/downstream
CREATE TABLE public.transport_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('upstream', 'downstream')),
  transport_mode TEXT NOT NULL, -- rodoviário, ferroviário, hidroviário, aéreo
  distance_km NUMERIC(12,2),
  weight_tonnes NUMERIC(15,2),
  fuel_type TEXT,
  fuel_consumption NUMERIC(12,2),
  emission_source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Criar tabela para relatórios padronizados GHG Protocol
CREATE TABLE public.ghg_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  report_year INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 'annual', 'verification', 'rpe'
  scope_1_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  scope_2_location_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  scope_2_market_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  scope_3_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  biogenic_co2 NUMERIC(15,2) NOT NULL DEFAULT 0,
  methodology_version TEXT DEFAULT '2025.0.1',
  verification_status TEXT DEFAULT 'not_verified',
  report_data JSONB NOT NULL DEFAULT '{}', -- dados detalhados do relatório
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, report_year, report_type)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.variable_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_use_change ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wastewater_treatment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghg_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para variable_factors (dados públicos, todos podem ler)
CREATE POLICY "Anyone can view variable factors" 
ON public.variable_factors FOR SELECT 
USING (true);

-- Políticas RLS para land_use_change
CREATE POLICY "Users can manage their company land use data" 
ON public.land_use_change FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para wastewater_treatment
CREATE POLICY "Users can manage their company wastewater data" 
ON public.wastewater_treatment FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para transport_distribution
CREATE POLICY "Users can manage their company transport data" 
ON public.transport_distribution FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para ghg_reports
CREATE POLICY "Users can manage their company reports" 
ON public.ghg_reports FOR ALL 
USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_variable_factors_updated_at
BEFORE UPDATE ON public.variable_factors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_land_use_change_updated_at
BEFORE UPDATE ON public.land_use_change
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wastewater_treatment_updated_at
BEFORE UPDATE ON public.wastewater_treatment
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_distribution_updated_at
BEFORE UPDATE ON public.transport_distribution
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ghg_reports_updated_at
BEFORE UPDATE ON public.ghg_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir fatores variáveis brasileiros para 2024 (dados exemplo baseados na legislação)
INSERT INTO public.variable_factors (year, month, biodiesel_percentage, ethanol_percentage, electricity_sin_factor) VALUES 
(2024, 1, 12.0, 27.0, 0.0805), -- janeiro
(2024, 2, 12.0, 27.0, 0.0798),
(2024, 3, 12.0, 27.0, 0.0812),
(2024, 4, 12.0, 27.0, 0.0791),
(2024, 5, 12.0, 27.0, 0.0823),
(2024, 6, 12.0, 27.0, 0.0834),
(2024, 7, 12.0, 27.0, 0.0819),
(2024, 8, 12.0, 27.0, 0.0825),
(2024, 9, 12.0, 27.0, 0.0811),
(2024, 10, 12.0, 27.0, 0.0803),
(2024, 11, 12.0, 27.0, 0.0797),
(2024, 12, 12.0, 27.0, 0.0789);

-- Inserir dados para 2025
INSERT INTO public.variable_factors (year, month, biodiesel_percentage, ethanol_percentage, electricity_sin_factor) VALUES 
(2025, 1, 12.0, 27.0, 0.0795),
(2025, 2, 12.0, 27.0, 0.0801),
(2025, 3, 12.0, 27.0, 0.0807),
(2025, 4, 12.0, 27.0, 0.0789),
(2025, 5, 12.0, 27.0, 0.0815),
(2025, 6, 12.0, 27.0, 0.0821),
(2025, 7, 12.0, 27.0, 0.0813),
(2025, 8, 12.0, 27.0, 0.0819),
(2025, 9, 12.0, 27.0, 0.0808),
(2025, 10, 12.0, 27.0, 0.0799),
(2025, 11, 12.0, 27.0, 0.0792),
(2025, 12, 12.0, 27.0, 0.0786);