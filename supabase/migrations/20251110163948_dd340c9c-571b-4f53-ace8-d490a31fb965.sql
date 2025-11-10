-- Create table for governance data collection
CREATE TABLE gri_governance_data_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Estatuto Social e Regimentos
  has_bylaws_updated BOOLEAN DEFAULT false,
  bylaws_last_update_date DATE,
  bylaws_publicly_accessible BOOLEAN DEFAULT false,
  bylaws_notes TEXT,
  
  -- Pergunta 2: Organograma
  has_formal_org_chart BOOLEAN DEFAULT false,
  org_chart_last_update_date DATE,
  decision_flows_documented BOOLEAN DEFAULT false,
  org_chart_notes TEXT,
  
  -- Pergunta 3: Código de Ética/Conduta
  has_code_of_conduct BOOLEAN DEFAULT false,
  code_of_conduct_approval_date DATE,
  code_applies_to TEXT[],
  code_training_mandatory BOOLEAN DEFAULT false,
  code_notes TEXT,
  
  -- Pergunta 4: Políticas de Compliance
  has_compliance_policies BOOLEAN DEFAULT false,
  compliance_policies_list TEXT[],
  has_whistleblower_channel BOOLEAN DEFAULT false,
  whistleblower_channel_url TEXT,
  compliance_notes TEXT,
  
  -- Pergunta 5: Transparência e Prestação de Contas
  has_transparency_practices BOOLEAN DEFAULT false,
  transparency_mechanisms TEXT[],
  transparency_notes TEXT,
  
  -- DADOS QUANTITATIVOS (GRI 2-9 a 2-27)
  board_total_members INTEGER,
  board_independent_members INTEGER,
  board_women_percentage DECIMAL(5,2),
  board_under_30_percentage DECIMAL(5,2),
  board_30_50_percentage DECIMAL(5,2),
  board_over_50_percentage DECIMAL(5,2),
  
  -- Diversidade do Conselho (GRI 2-10)
  board_diversity_ethnicity JSONB,
  board_diversity_vulnerable_groups INTEGER,
  
  -- Treinamentos (GRI 2-17, ISO 37001)
  ethics_training_hours_total DECIMAL(10,2),
  ethics_training_employees_trained INTEGER,
  compliance_training_frequency TEXT,
  
  -- Gestão de Riscos (GRI 2-12, 2-13)
  risk_committee_exists BOOLEAN DEFAULT false,
  risk_assessment_frequency TEXT,
  
  -- Remuneração (GRI 2-18 a 2-21)
  remuneration_policy_approved BOOLEAN DEFAULT false,
  remuneration_linked_to_esg BOOLEAN DEFAULT false,
  highest_to_median_salary_ratio DECIMAL(10,2),
  
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

-- Create indexes
CREATE INDEX idx_gri_governance_data_report_id ON gri_governance_data_collection(report_id);
CREATE INDEX idx_gri_governance_data_company_id ON gri_governance_data_collection(company_id);

-- Enable RLS
ALTER TABLE gri_governance_data_collection ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company governance data"
  ON gri_governance_data_collection FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company governance data"
  ON gri_governance_data_collection FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company governance data"
  ON gri_governance_data_collection FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );