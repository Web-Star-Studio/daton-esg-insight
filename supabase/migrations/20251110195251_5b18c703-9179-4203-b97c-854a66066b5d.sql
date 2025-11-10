-- Create table for GRI Audits and Assessments Data
CREATE TABLE gri_audits_assessments_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Auditorias Internas/Externas Periódicas
  has_periodic_audits BOOLEAN DEFAULT false,
  internal_audits_count INTEGER,
  external_audits_count INTEGER,
  audit_frequency TEXT,
  last_internal_audit_date DATE,
  last_external_audit_date DATE,
  audit_schedule_exists BOOLEAN DEFAULT false,
  audit_coverage_percentage DECIMAL(5,2),
  audits_list JSONB,
  internal_audit_team_size INTEGER,
  external_auditors TEXT[],
  audits_notes TEXT,
  
  -- Pergunta 2: Certificações e Selos
  has_certifications BOOLEAN DEFAULT false,
  certifications_count INTEGER,
  certifications_list JSONB,
  
  iso_9001_certified BOOLEAN DEFAULT false,
  iso_9001_issue_date DATE,
  iso_9001_expiry_date DATE,
  
  iso_14001_certified BOOLEAN DEFAULT false,
  iso_14001_issue_date DATE,
  iso_14001_expiry_date DATE,
  
  iso_45001_certified BOOLEAN DEFAULT false,
  iso_45001_issue_date DATE,
  iso_45001_expiry_date DATE,
  
  iso_50001_certified BOOLEAN DEFAULT false,
  iso_50001_issue_date DATE,
  iso_50001_expiry_date DATE,
  
  iso_26000_adherence BOOLEAN DEFAULT false,
  
  iso_27001_certified BOOLEAN DEFAULT false,
  iso_27001_issue_date DATE,
  iso_27001_expiry_date DATE,
  
  iso_37001_certified BOOLEAN DEFAULT false,
  iso_37001_issue_date DATE,
  iso_37001_expiry_date DATE,
  
  sa_8000_certified BOOLEAN DEFAULT false,
  sa_8000_issue_date DATE,
  sa_8000_expiry_date DATE,
  
  green_seal_certified BOOLEAN DEFAULT false,
  procel_certified BOOLEAN DEFAULT false,
  fsc_certified BOOLEAN DEFAULT false,
  leed_certified BOOLEAN DEFAULT false,
  leed_level TEXT,
  carbon_neutral_certified BOOLEAN DEFAULT false,
  b_corp_certified BOOLEAN DEFAULT false,
  
  esg_rating_score DECIMAL(5,2),
  esg_rating_agency TEXT,
  esg_rating_level TEXT,
  esg_rating_date DATE,
  
  certifications_notes TEXT,
  
  -- Pergunta 3: Avaliações de Impacto Socioambiental
  has_impact_assessments BOOLEAN DEFAULT false,
  impact_assessments_count INTEGER,
  impact_assessments_list JSONB,
  
  environmental_impact_assessment_done BOOLEAN DEFAULT false,
  social_impact_assessment_done BOOLEAN DEFAULT false,
  human_rights_impact_assessment_done BOOLEAN DEFAULT false,
  lifecycle_assessment_done BOOLEAN DEFAULT false,
  carbon_footprint_calculated BOOLEAN DEFAULT false,
  water_footprint_calculated BOOLEAN DEFAULT false,
  biodiversity_assessment_done BOOLEAN DEFAULT false,
  
  impact_assessment_methodologies TEXT[],
  third_party_assessment BOOLEAN DEFAULT false,
  assessment_certifier TEXT,
  
  impact_assessments_notes TEXT,
  
  -- Pergunta 4: Planos de Ação Corretiva e Não Conformidades
  has_corrective_action_plans BOOLEAN DEFAULT false,
  total_non_conformities INTEGER,
  non_conformities_by_severity JSONB,
  open_non_conformities INTEGER,
  closed_non_conformities INTEGER,
  non_conformities_closure_rate DECIMAL(5,2),
  
  corrective_actions_count INTEGER,
  corrective_actions_completed INTEGER,
  corrective_actions_in_progress INTEGER,
  corrective_actions_overdue INTEGER,
  average_closure_time_days DECIMAL(5,2),
  
  preventive_actions_implemented INTEGER,
  continuous_improvement_initiatives INTEGER,
  
  corrective_action_notes TEXT,
  
  -- GRI 2-5: Verificação Externa
  has_external_verification BOOLEAN DEFAULT false,
  verification_provider TEXT,
  verification_standard TEXT,
  verification_level TEXT,
  verification_scope TEXT,
  verification_coverage_percentage DECIMAL(5,2),
  verification_date DATE,
  verification_report_available BOOLEAN DEFAULT false,
  verification_statement_url TEXT,
  governance_involvement BOOLEAN DEFAULT false,
  
  verified_indicators_count INTEGER,
  verified_indicators_list TEXT[],
  
  audits_evolution JSONB,
  
  audit_maturity_level TEXT,
  years_with_systematic_audits INTEGER,
  
  audits_by_area JSONB,
  
  annual_audit_budget DECIMAL(15,2),
  annual_certification_costs DECIMAL(15,2),
  roi_from_certifications TEXT,
  
  process_improvements_from_audits INTEGER,
  cost_savings_from_improvements DECIMAL(15,2),
  new_contracts_due_certifications INTEGER,
  
  awards_for_quality_esg INTEGER,
  positive_client_audits_count INTEGER,
  supplier_audit_score DECIMAL(5,2),
  
  regulatory_audits_count INTEGER,
  regulatory_fines_received INTEGER,
  regulatory_fines_total_value DECIMAL(15,2),
  days_without_regulatory_incidents INTEGER,
  
  -- Análise da IA
  ai_analysis JSONB,
  ai_generated_text TEXT,
  ai_confidence_score DECIMAL(5,2),
  ai_last_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  documents_checklist JSONB,
  
  linked_audits UUID[],
  
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gri_audits_assessments_report_id ON gri_audits_assessments_data(report_id);
CREATE INDEX idx_gri_audits_assessments_company_id ON gri_audits_assessments_data(company_id);

-- RLS Policies
ALTER TABLE gri_audits_assessments_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company audits assessments data"
  ON gri_audits_assessments_data FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company audits assessments data"
  ON gri_audits_assessments_data FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company audits assessments data"
  ON gri_audits_assessments_data FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));