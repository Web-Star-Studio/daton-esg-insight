-- ====================================
-- MÓDULO: RELATÓRIOS E NORMAS
-- Cobertura: GRI 2-3, 2-4, 2-5
-- ====================================

-- 1. Criar tabela principal
CREATE TABLE IF NOT EXISTS gri_reporting_standards_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Relatórios ESG/Sustentabilidade Anteriores
  has_previous_reports BOOLEAN DEFAULT false,
  first_report_year INTEGER,
  total_reports_published INTEGER,
  report_frequency TEXT,
  previous_reports_list JSONB,
  reporting_evolution_notes TEXT,
  
  -- Pergunta 2: Aderência a Padrões
  has_framework_adherence BOOLEAN DEFAULT false,
  frameworks_adopted TEXT[],
  gri_version_used TEXT,
  gri_application_level TEXT,
  sasb_industry_standard TEXT,
  tcfd_implementation_status TEXT,
  abnt_pr2030_adherence_level TEXT,
  frameworks_alignment_matrix JSONB,
  frameworks_notes TEXT,
  
  -- Pergunta 3: Políticas e Indicadores Alinhados
  has_aligned_policies BOOLEAN DEFAULT false,
  total_policies_documented INTEGER,
  policies_by_category JSONB,
  total_kpis_tracked INTEGER,
  kpis_by_framework JSONB,
  kpis_evolution JSONB,
  data_quality_score DECIMAL(5,2),
  policies_notes TEXT,
  
  -- Pergunta 4: Benchmarking Setorial
  has_benchmarking_studies BOOLEAN DEFAULT false,
  benchmarking_sources TEXT[],
  sector_position_ranking INTEGER,
  sector_average_score DECIMAL(5,2),
  company_score DECIMAL(5,2),
  top_performer_score DECIMAL(5,2),
  benchmarking_insights JSONB,
  competitive_advantages TEXT[],
  improvement_opportunities TEXT[],
  benchmarking_notes TEXT,
  
  -- GRI 2-3: Período de Reporte
  reporting_period_start DATE,
  reporting_period_end DATE,
  reporting_cycle_duration_months INTEGER,
  last_report_publication_date DATE,
  next_report_expected_date DATE,
  
  -- GRI 2-4: Reexpressão de Informações
  has_restatements BOOLEAN DEFAULT false,
  restatements_count INTEGER,
  restatements_details JSONB,
  restatements_impact TEXT,
  
  -- GRI 2-5: Verificação Externa
  has_external_assurance BOOLEAN DEFAULT false,
  assurance_provider TEXT,
  assurance_level TEXT,
  assurance_scope TEXT,
  assurance_standards TEXT,
  assurance_coverage_percentage DECIMAL(5,2),
  assurance_certificate_date DATE,
  
  -- Métricas de Maturidade
  reporting_maturity_level TEXT,
  years_of_reporting INTEGER,
  indicators_disclosed_count INTEGER,
  indicators_disclosed_evolution JSONB,
  pages_published_evolution JSONB,
  
  -- Completude GRI
  gri_universal_standards_coverage DECIMAL(5,2),
  gri_topic_standards_coverage DECIMAL(5,2),
  total_gri_indicators_reported INTEGER,
  mandatory_indicators_reported INTEGER,
  optional_indicators_reported INTEGER,
  
  -- Reconhecimento
  reporting_awards_received INTEGER,
  reporting_awards_list JSONB,
  
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

-- 2. Criar índices
CREATE INDEX idx_gri_reporting_standards_report_id ON gri_reporting_standards_data(report_id);
CREATE INDEX idx_gri_reporting_standards_company_id ON gri_reporting_standards_data(company_id);

-- 3. Habilitar RLS
ALTER TABLE gri_reporting_standards_data ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Users can view own company reporting standards data"
  ON gri_reporting_standards_data FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company reporting standards data"
  ON gri_reporting_standards_data FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company reporting standards data"
  ON gri_reporting_standards_data FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own company reporting standards data"
  ON gri_reporting_standards_data FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 5. Trigger para updated_at
CREATE TRIGGER update_gri_reporting_standards_updated_at
  BEFORE UPDATE ON gri_reporting_standards_data
  FOR EACH ROW
  EXECUTE FUNCTION update_gri_wizard_updated_at();