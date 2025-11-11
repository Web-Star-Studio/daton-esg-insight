-- Adicionar campos de emissões biogênicas em emission_factors
ALTER TABLE public.emission_factors
  ADD COLUMN IF NOT EXISTS is_biogenic BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS biogenic_co2_factor DECIMAL(15,6) DEFAULT 0;

COMMENT ON COLUMN public.emission_factors.is_biogenic IS 'Indica se o fator representa emissões biogênicas (etanol, biodiesel, biomassa)';
COMMENT ON COLUMN public.emission_factors.biogenic_co2_factor IS 'Fator de emissão de CO2 biogênico separado (kg CO2/unidade)';

-- Adicionar campos de emissões biogênicas em calculated_emissions
ALTER TABLE public.calculated_emissions
  ADD COLUMN IF NOT EXISTS biogenic_co2_kg DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_biogenic_source BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.calculated_emissions.biogenic_co2_kg IS 'Emissões de CO2 biogênico em kg';

-- Criar tabela ghg_inventory_summary
CREATE TABLE IF NOT EXISTS public.ghg_inventory_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Ano do inventário
  inventory_year INTEGER NOT NULL,
  base_year INTEGER,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  
  -- Emissões por escopo (tCO2e)
  scope_1_total DECIMAL(15,3) DEFAULT 0,
  scope_2_total DECIMAL(15,3) DEFAULT 0,
  scope_3_total DECIMAL(15,3) DEFAULT 0,
  total_emissions DECIMAL(15,3) DEFAULT 0,
  
  -- Emissões biogênicas (tCO2e)
  biogenic_emissions DECIMAL(15,3) DEFAULT 0,
  
  -- Metodologia e certificação
  methodology TEXT DEFAULT 'GHG Protocol',
  ghg_protocol_seal VARCHAR(20),
  is_third_party_verified BOOLEAN DEFAULT false,
  verification_body TEXT,
  verification_date DATE,
  
  -- Escopo 1 - Breakdown
  scope_1_stationary_combustion DECIMAL(15,3) DEFAULT 0,
  scope_1_mobile_combustion DECIMAL(15,3) DEFAULT 0,
  scope_1_fugitive_emissions DECIMAL(15,3) DEFAULT 0,
  scope_1_industrial_processes DECIMAL(15,3) DEFAULT 0,
  scope_1_agriculture DECIMAL(15,3) DEFAULT 0,
  
  -- Escopo 2 - Breakdown
  scope_2_electricity_location DECIMAL(15,3) DEFAULT 0,
  scope_2_electricity_market DECIMAL(15,3) DEFAULT 0,
  scope_2_heat_steam DECIMAL(15,3) DEFAULT 0,
  scope_2_cooling DECIMAL(15,3) DEFAULT 0,
  
  -- Escopo 3 - Principais categorias
  scope_3_purchased_goods DECIMAL(15,3) DEFAULT 0,
  scope_3_capital_goods DECIMAL(15,3) DEFAULT 0,
  scope_3_fuel_energy DECIMAL(15,3) DEFAULT 0,
  scope_3_upstream_transport DECIMAL(15,3) DEFAULT 0,
  scope_3_waste DECIMAL(15,3) DEFAULT 0,
  scope_3_business_travel DECIMAL(15,3) DEFAULT 0,
  scope_3_employee_commuting DECIMAL(15,3) DEFAULT 0,
  scope_3_leased_assets DECIMAL(15,3) DEFAULT 0,
  scope_3_downstream_transport DECIMAL(15,3) DEFAULT 0,
  scope_3_product_use DECIMAL(15,3) DEFAULT 0,
  scope_3_end_of_life DECIMAL(15,3) DEFAULT 0,
  scope_3_other DECIMAL(15,3) DEFAULT 0,
  
  -- Metadados
  data_quality_score DECIMAL(3,1),
  completeness_percentage INTEGER,
  notes TEXT,
  calculation_method TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'Em Elaboração',
  approved_by_user_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_company_inventory_year UNIQUE (company_id, inventory_year)
);

-- Índices
CREATE INDEX idx_ghg_inventory_company ON public.ghg_inventory_summary(company_id);
CREATE INDEX idx_ghg_inventory_year ON public.ghg_inventory_summary(inventory_year);

-- RLS
ALTER TABLE public.ghg_inventory_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company GHG inventory"
  ON public.ghg_inventory_summary FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Trigger
CREATE TRIGGER update_ghg_inventory_summary_updated_at
  BEFORE UPDATE ON public.ghg_inventory_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campos GHG em gri_environmental_data_collection
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS ghg_scope_1_total DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS ghg_scope_2_total DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS ghg_scope_3_total DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS ghg_total_emissions DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS ghg_biogenic_emissions DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS ghg_inventory_year INTEGER,
  ADD COLUMN IF NOT EXISTS ghg_base_year INTEGER,
  ADD COLUMN IF NOT EXISTS ghg_methodology TEXT,
  ADD COLUMN IF NOT EXISTS ghg_protocol_seal VARCHAR(20);