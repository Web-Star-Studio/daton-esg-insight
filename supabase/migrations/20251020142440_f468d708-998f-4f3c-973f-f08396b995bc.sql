-- Phase 5: Supplier Management System
CREATE TABLE IF NOT EXISTS public.emission_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  cnpj TEXT,
  category TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  emission_data JSONB DEFAULT '{}'::jsonb,
  has_inventory BOOLEAN DEFAULT false,
  last_report_date DATE,
  scope_3_category TEXT,
  annual_emissions_estimate NUMERIC,
  data_quality_score INTEGER CHECK (data_quality_score >= 1 AND data_quality_score <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emission_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company suppliers"
  ON public.emission_suppliers
  FOR ALL
  USING (company_id = get_user_company_id());

-- Phase 6: Custom ESG Indicators
CREATE TABLE IF NOT EXISTS public.custom_esg_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  indicator_name TEXT NOT NULL,
  indicator_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance')),
  unit TEXT,
  calculation_method TEXT,
  target_value NUMERIC,
  current_value NUMERIC,
  measurement_frequency TEXT,
  responsible_user_id UUID,
  data_sources JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, indicator_code)
);

ALTER TABLE public.custom_esg_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company custom indicators"
  ON public.custom_esg_indicators
  FOR ALL
  USING (company_id = get_user_company_id());

-- Phase 7: Data Correlation Analysis
CREATE TABLE IF NOT EXISTS public.correlation_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_name TEXT NOT NULL,
  metric_x TEXT NOT NULL,
  metric_y TEXT NOT NULL,
  correlation_coefficient NUMERIC,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  data_points JSONB DEFAULT '[]'::jsonb,
  insights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.correlation_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company correlation analyses"
  ON public.correlation_analysis_results
  FOR ALL
  USING (company_id = get_user_company_id());

-- Phase 8: Double Materiality Matrix
CREATE TABLE IF NOT EXISTS public.double_materiality_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('environmental', 'social', 'governance')),
  financial_materiality_score INTEGER CHECK (financial_materiality_score >= 1 AND financial_materiality_score <= 5),
  impact_materiality_score INTEGER CHECK (impact_materiality_score >= 1 AND impact_materiality_score <= 5),
  stakeholders_consulted TEXT[],
  assessment_date DATE NOT NULL,
  description TEXT,
  management_approach TEXT,
  related_gri_indicators TEXT[],
  is_material BOOLEAN GENERATED ALWAYS AS (
    (financial_materiality_score >= 3) OR (impact_materiality_score >= 3)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.double_materiality_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company materiality matrix"
  ON public.double_materiality_matrix
  FOR ALL
  USING (company_id = get_user_company_id());

-- Phase 2: Enhanced registration - ESG Insights Log
CREATE TABLE IF NOT EXISTS public.esg_insights_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  related_module TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.esg_insights_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company insights"
  ON public.esg_insights_log
  FOR ALL
  USING (company_id = get_user_company_id());