-- ============================
-- GRI 201-1: VALOR ECONÔMICO DIRETO GERADO (DEG)
-- ============================

ALTER TABLE public.gri_economic_data_collection
  -- Componentes do DEG
  ADD COLUMN IF NOT EXISTS gross_revenue NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS financial_income NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS asset_sales_income NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS other_income NUMERIC(15,2),
  
  -- Total DEG (calculado)
  ADD COLUMN IF NOT EXISTS direct_economic_value_generated NUMERIC(15,2),
  
  -- ============================
  -- GRI 201-1: VALOR ECONÔMICO DISTRIBUÍDO (DED)
  -- ============================
  
  -- 1. Custos Operacionais
  ADD COLUMN IF NOT EXISTS raw_materials_costs NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS supplier_payments NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS other_operational_costs NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_operational_costs NUMERIC(15,2),
  
  -- 2. Salários e Benefícios
  ADD COLUMN IF NOT EXISTS employee_salaries NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS employee_benefits NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_employee_compensation NUMERIC(15,2),
  
  -- 3. Pagamentos a Provedores de Capital
  ADD COLUMN IF NOT EXISTS interest_payments NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS dividends_paid NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS loan_repayments NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_capital_providers_payments NUMERIC(15,2),
  
  -- 4. Pagamentos ao Governo
  ADD COLUMN IF NOT EXISTS income_taxes NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS sales_taxes NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS payroll_taxes NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS other_taxes NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_government_payments NUMERIC(15,2),
  
  -- 5. Investimentos na Comunidade
  ADD COLUMN IF NOT EXISTS community_investments NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS voluntary_donations NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS sponsorships NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS infrastructure_investments NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_community_investments NUMERIC(15,2),
  
  -- Total DED (calculado)
  ADD COLUMN IF NOT EXISTS direct_economic_value_distributed NUMERIC(15,2),
  
  -- ============================
  -- GRI 201-1: VALOR ECONÔMICO RETIDO (VER)
  -- ============================
  
  ADD COLUMN IF NOT EXISTS economic_value_retained NUMERIC(15,2),
  
  -- ============================
  -- BREAKDOWN DETALHADO (JSONB para flexibilidade)
  -- ============================
  
  ADD COLUMN IF NOT EXISTS value_distribution_breakdown JSONB,
  
  -- ============================
  -- PERÍODO ANTERIOR (para comparação)
  -- ============================
  
  ADD COLUMN IF NOT EXISTS previous_period_deg NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS previous_period_ded NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS previous_period_ver NUMERIC(15,2),
  
  -- Crescimento percentual
  ADD COLUMN IF NOT EXISTS deg_growth_percentage NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS ded_growth_percentage NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS ver_growth_percentage NUMERIC(10,2),
  
  -- ============================
  -- ANÁLISE E COMPLIANCE
  -- ============================
  
  ADD COLUMN IF NOT EXISTS value_distribution_percentage JSONB,
  ADD COLUMN IF NOT EXISTS stakeholder_value_per_type JSONB,
  ADD COLUMN IF NOT EXISTS gri_201_1_complete_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS gri_201_1_missing_fields JSONB,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS value_distribution_calculation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS value_distribution_data_source TEXT;

-- ============================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================

COMMENT ON COLUMN public.gri_economic_data_collection.direct_economic_value_generated 
  IS 'GRI 201-1: Total do Valor Econômico Direto Gerado = Receitas + Receitas Financeiras + Venda de Ativos';

COMMENT ON COLUMN public.gri_economic_data_collection.direct_economic_value_distributed 
  IS 'GRI 201-1: Total do Valor Econômico Distribuído = Custos Operacionais + Salários + Pagamentos a Capital + Impostos + Investimentos Comunitários';

COMMENT ON COLUMN public.gri_economic_data_collection.economic_value_retained 
  IS 'GRI 201-1: Valor Econômico Retido = DEG - DED (reinvestido na empresa)';

COMMENT ON COLUMN public.gri_economic_data_collection.value_distribution_breakdown 
  IS 'Breakdown detalhado da distribuição de valor por categoria e subcategoria';

COMMENT ON COLUMN public.gri_economic_data_collection.value_distribution_percentage 
  IS 'Percentual de distribuição de valor para cada stakeholder group';