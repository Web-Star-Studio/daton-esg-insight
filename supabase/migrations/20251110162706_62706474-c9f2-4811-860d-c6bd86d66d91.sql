-- FASE 1: Criar tabela para captação de dados de estratégia
CREATE TABLE gri_strategy_data_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Perguntas Orientadoras (respostas estruturadas)
  has_mission_vision_values BOOLEAN DEFAULT false,
  mission_vision_values_updated_date DATE,
  mission_vision_values_notes TEXT,
  
  has_sustainability_policy BOOLEAN DEFAULT false,
  sustainability_policy_approval_date DATE,
  sustainability_policy_notes TEXT,
  
  has_strategic_plan_esg BOOLEAN DEFAULT false,
  strategic_plan_period TEXT,
  strategic_plan_notes TEXT,
  
  has_public_commitments BOOLEAN DEFAULT false,
  public_commitments_list TEXT[],
  public_commitments_notes TEXT,
  
  has_previous_results BOOLEAN DEFAULT false,
  previous_results_summary TEXT,
  
  -- Análise da IA
  ai_analysis JSONB,
  ai_generated_text TEXT,
  ai_confidence_score DECIMAL(5,2),
  ai_last_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  -- Checklist de documentos
  documents_checklist JSONB,
  
  -- Metadados
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gri_strategy_data_report_id ON gri_strategy_data_collection(report_id);
CREATE INDEX idx_gri_strategy_data_company_id ON gri_strategy_data_collection(company_id);

-- FASE 6: RLS Policies
ALTER TABLE gri_strategy_data_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company strategy data"
  ON gri_strategy_data_collection FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company strategy data"
  ON gri_strategy_data_collection FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company strategy data"
  ON gri_strategy_data_collection FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );