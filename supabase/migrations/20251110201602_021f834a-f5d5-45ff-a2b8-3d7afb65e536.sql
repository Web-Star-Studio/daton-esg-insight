-- ESG Indicator Cache - Simple version without date unique constraint
DROP TABLE IF EXISTS esg_indicator_cache CASCADE;

CREATE TABLE esg_indicator_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  indicators JSONB NOT NULL DEFAULT '{}',
  data_quality_score DECIMAL(5,2),
  calculation_period_start DATE,
  calculation_period_end DATE,
  metadata JSONB DEFAULT '{}'
);

-- Index for fast lookups
CREATE INDEX idx_esg_indicator_cache_company_date ON esg_indicator_cache(company_id, calculated_at DESC);

-- RLS Policy
ALTER TABLE esg_indicator_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company cache" 
  ON esg_indicator_cache FOR ALL 
  USING (company_id = get_user_company_id());