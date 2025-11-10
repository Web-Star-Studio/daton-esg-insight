-- Create GRI Economic Data Collection table
CREATE TABLE IF NOT EXISTS gri_economic_data_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  has_financial_statements BOOLEAN DEFAULT false,
  balance_sheet_date DATE,
  revenue_total DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  ebitda_margin DECIMAL(5,2),
  net_profit_margin DECIMAL(5,2),
  local_procurement_percentage DECIMAL(5,2),
  climate_related_risks_identified INTEGER,
  revenue_per_employee DECIMAL(15,2),
  operating_costs DECIMAL(15,2),
  employee_wages_benefits DECIMAL(15,2),
  local_suppliers_count INTEGER,
  total_suppliers_count INTEGER,
  ai_analysis JSONB,
  ai_generated_text TEXT,
  ai_confidence_score DECIMAL(5,2),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  reporting_period_start DATE,
  reporting_period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gri_economic_report ON gri_economic_data_collection(report_id);
ALTER TABLE gri_economic_data_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economic_company_access" ON gri_economic_data_collection
  FOR ALL USING (company_id = get_user_company_id());