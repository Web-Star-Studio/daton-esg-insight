-- Create table for GRI Stakeholder Engagement Data Collection
CREATE TABLE IF NOT EXISTS gri_stakeholder_engagement_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Mapeamento e Matriz de Stakeholders
  has_stakeholder_mapping BOOLEAN DEFAULT false,
  stakeholder_mapping_methodology TEXT,
  stakeholder_mapping_last_update DATE,
  stakeholder_mapping_frequency TEXT,
  total_stakeholder_groups INTEGER,
  critical_stakeholders_count INTEGER,
  stakeholder_mapping_notes TEXT,
  
  -- Pergunta 2: Registros de Reuniões e Consultas
  has_engagement_records BOOLEAN DEFAULT false,
  engagement_record_types TEXT[],
  engagement_frequency_by_group JSONB,
  total_engagement_events INTEGER,
  engagement_hours_total DECIMAL(10,2),
  engagement_records_notes TEXT,
  
  -- Pergunta 3: Pesquisas de Satisfação e Engajamento
  has_stakeholder_surveys BOOLEAN DEFAULT false,
  survey_types TEXT[],
  surveys_conducted_count INTEGER,
  survey_response_rate DECIMAL(5,2),
  survey_last_conducted_date DATE,
  survey_results_summary TEXT,
  surveys_notes TEXT,
  
  -- Pergunta 4: Parcerias, Acordos e Fóruns Setoriais
  has_partnerships BOOLEAN DEFAULT false,
  partnership_types TEXT[],
  active_partnerships_count INTEGER,
  partnerships_list JSONB,
  sectoral_forums TEXT[],
  partnerships_notes TEXT,
  
  -- Dados Quantitativos (GRI 2-29)
  total_stakeholders_mapped INTEGER,
  stakeholders_by_category JSONB,
  high_influence_stakeholders INTEGER,
  high_interest_stakeholders INTEGER,
  critical_stakeholders INTEGER,
  
  stakeholders_low_influence INTEGER,
  stakeholders_medium_influence INTEGER,
  stakeholders_high_influence INTEGER,
  
  stakeholders_low_interest INTEGER,
  stakeholders_medium_interest INTEGER,
  stakeholders_high_interest INTEGER,
  
  stakeholders_monthly_engagement INTEGER,
  stakeholders_quarterly_engagement INTEGER,
  stakeholders_biannual_engagement INTEGER,
  stakeholders_annual_engagement INTEGER,
  
  preferred_communication_channels JSONB,
  average_engagement_score DECIMAL(5,2),
  
  total_surveys_sent INTEGER,
  total_survey_responses INTEGER,
  survey_response_rate_calculated DECIMAL(5,2),
  average_satisfaction_score DECIMAL(5,2),
  
  total_meetings_held INTEGER,
  total_participants INTEGER,
  average_meeting_frequency DECIMAL(5,2),
  
  active_partnerships INTEGER,
  sectoral_memberships INTEGER,
  collaborative_projects INTEGER,
  
  communication_channels TEXT[],
  has_formal_grievance_mechanism BOOLEAN DEFAULT false,
  grievances_received INTEGER,
  grievances_resolved INTEGER,
  grievance_resolution_rate DECIMAL(5,2),
  
  sector_average_stakeholder_count INTEGER,
  sector_average_engagement_score DECIMAL(5,2),
  sector_average_survey_response_rate DECIMAL(5,2),
  
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

-- Create indexes
CREATE INDEX idx_gri_stakeholder_eng_report_id ON gri_stakeholder_engagement_data(report_id);
CREATE INDEX idx_gri_stakeholder_eng_company_id ON gri_stakeholder_engagement_data(company_id);

-- Enable RLS
ALTER TABLE gri_stakeholder_engagement_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own company stakeholder engagement data"
  ON gri_stakeholder_engagement_data FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company stakeholder engagement data"
  ON gri_stakeholder_engagement_data FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company stakeholder engagement data"
  ON gri_stakeholder_engagement_data FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own company stakeholder engagement data"
  ON gri_stakeholder_engagement_data FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Add document categories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category_enum') THEN
    RAISE NOTICE 'document_category_enum does not exist, skipping';
  ELSE
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Matriz de Stakeholders';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Ata de Reunião';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Relatório de Consulta';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Ata de Assembleia';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Relatório de Pesquisa';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Resultado de Survey';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Termo de Parceria';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Acordo de Cooperação';
    ALTER TYPE document_category_enum ADD VALUE IF NOT EXISTS 'Certificado de Membro';
  END IF;
END $$;