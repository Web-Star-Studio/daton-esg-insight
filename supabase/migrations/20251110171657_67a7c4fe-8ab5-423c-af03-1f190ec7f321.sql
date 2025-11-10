-- Create table for GRI Social Data Collection
CREATE TABLE gri_social_data_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Políticas de Diversidade e Inclusão
  has_diversity_policy BOOLEAN DEFAULT false,
  diversity_policy_approval_date DATE,
  diversity_initiatives TEXT[],
  diversity_policy_notes TEXT,
  
  -- Pergunta 2: Saúde e Segurança Ocupacional
  has_health_safety_programs BOOLEAN DEFAULT false,
  has_occupational_health_service BOOLEAN DEFAULT false,
  has_cipa BOOLEAN DEFAULT false,
  has_safety_training_program BOOLEAN DEFAULT false,
  health_safety_certifications TEXT[],
  health_safety_notes TEXT,
  
  -- Pergunta 3: Treinamentos e Capacitações
  has_training_records BOOLEAN DEFAULT false,
  training_types TEXT[],
  has_training_effectiveness_evaluation BOOLEAN DEFAULT false,
  training_notes TEXT,
  
  -- Pergunta 4: Projetos Sociais e Comunitários
  has_social_projects BOOLEAN DEFAULT false,
  social_project_types TEXT[],
  social_investment_annual DECIMAL(15,2),
  beneficiaries_count INTEGER,
  social_projects_notes TEXT,
  
  -- Pergunta 5: Indicadores Sociais
  tracks_social_indicators BOOLEAN DEFAULT false,
  indicators_tracked TEXT[],
  reporting_frequency TEXT,
  indicators_notes TEXT,
  
  -- Pergunta 6: Benefícios e Incentivos
  has_benefits_program BOOLEAN DEFAULT false,
  benefits_offered TEXT[],
  has_performance_bonus BOOLEAN DEFAULT false,
  benefits_notes TEXT,
  
  -- GRI 401: Emprego
  total_employees INTEGER,
  employees_men INTEGER,
  employees_women INTEGER,
  employees_non_binary INTEGER,
  employees_permanent INTEGER,
  employees_temporary INTEGER,
  employees_full_time INTEGER,
  employees_part_time INTEGER,
  new_hires_total INTEGER,
  new_hires_rate DECIMAL(5,2),
  turnover_total INTEGER,
  turnover_rate DECIMAL(5,2),
  
  -- GRI 401-2: Benefícios
  employees_with_health_insurance INTEGER,
  employees_with_life_insurance INTEGER,
  employees_with_retirement_plan INTEGER,
  parental_leave_male_eligible INTEGER,
  parental_leave_female_eligible INTEGER,
  parental_leave_male_taken INTEGER,
  parental_leave_female_taken INTEGER,
  
  -- GRI 403: Saúde e Segurança no Trabalho
  total_safety_incidents INTEGER,
  lost_time_incidents INTEGER,
  days_lost INTEGER,
  fatalities INTEGER,
  incident_rate DECIMAL(10,4),
  lost_time_incident_rate DECIMAL(10,4),
  absenteeism_rate DECIMAL(5,2),
  occupational_diseases_cases INTEGER,
  
  -- GRI 404: Treinamento e Educação
  total_training_hours DECIMAL(15,2),
  average_training_hours_per_employee DECIMAL(10,2),
  training_hours_men DECIMAL(15,2),
  training_hours_women DECIMAL(15,2),
  training_investment_total DECIMAL(15,2),
  employees_trained INTEGER,
  training_coverage_rate DECIMAL(5,2),
  
  -- GRI 405: Diversidade e Igualdade de Oportunidades
  employees_under_30 INTEGER,
  employees_30_50 INTEGER,
  employees_over_50 INTEGER,
  employees_pcd INTEGER,
  employees_ethnic_minorities INTEGER,
  leadership_women_percentage DECIMAL(5,2),
  wage_gap_gender DECIMAL(5,2),
  
  -- GRI 406: Não Discriminação
  discrimination_incidents_reported INTEGER,
  discrimination_incidents_resolved INTEGER,
  
  -- Comparação com Setor
  sector_average_turnover_rate DECIMAL(5,2),
  sector_average_training_hours DECIMAL(10,2),
  sector_average_women_leadership DECIMAL(5,2),
  sector_average_incident_rate DECIMAL(10,4),
  
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
  reporting_period_start DATE,
  reporting_period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gri_social_data_report_id ON gri_social_data_collection(report_id);
CREATE INDEX idx_gri_social_data_company_id ON gri_social_data_collection(company_id);

ALTER TABLE gri_social_data_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company social data"
  ON gri_social_data_collection FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company social data"
  ON gri_social_data_collection FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company social data"
  ON gri_social_data_collection FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));