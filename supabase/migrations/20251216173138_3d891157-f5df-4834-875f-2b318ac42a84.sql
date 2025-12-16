-- =============================================
-- PORTAL DE ACESSO EXTERNO DO FORNECEDOR [EXT1]
-- =============================================

-- 1. Adicionar colunas de autenticação na tabela supplier_management
ALTER TABLE supplier_management
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT true;

-- 2. Criar tabela de sessões do portal do fornecedor
CREATE TABLE supplier_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true
);

-- 3. Criar tabela de leituras obrigatórias
CREATE TABLE supplier_mandatory_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_path TEXT,
  category_id UUID REFERENCES supplier_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  requires_confirmation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Criar tabela de confirmações de leitura
CREATE TABLE supplier_reading_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES supplier_mandatory_readings(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  UNIQUE(supplier_id, reading_id)
);

-- 5. Criar tabela de pesquisas/questionários
CREATE TABLE supplier_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  custom_form_id UUID REFERENCES custom_forms(id) ON DELETE SET NULL,
  category_id UUID REFERENCES supplier_categories(id) ON DELETE SET NULL,
  is_mandatory BOOLEAN DEFAULT false,
  due_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Criar tabela de respostas de pesquisas
CREATE TABLE supplier_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES supplier_surveys(id) ON DELETE CASCADE,
  form_submission_id UUID,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(supplier_id, survey_id)
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- supplier_sessions: Acesso apenas por funções de servidor
ALTER TABLE supplier_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier sessions - server access only"
ON supplier_sessions FOR ALL
USING (false);

-- supplier_mandatory_readings: Empresa pode gerenciar suas leituras
ALTER TABLE supplier_mandatory_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can manage their mandatory readings"
ON supplier_mandatory_readings FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- supplier_reading_confirmations: Empresa pode ver confirmações
ALTER TABLE supplier_reading_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can view reading confirmations"
ON supplier_reading_confirmations FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM supplier_management 
    WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- supplier_surveys: Empresa pode gerenciar suas pesquisas
ALTER TABLE supplier_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can manage their surveys"
ON supplier_surveys FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- supplier_survey_responses: Empresa pode ver respostas
ALTER TABLE supplier_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can view survey responses"
ON supplier_survey_responses FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM supplier_management 
    WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_supplier_sessions_token ON supplier_sessions(session_token);
CREATE INDEX idx_supplier_sessions_supplier ON supplier_sessions(supplier_id);
CREATE INDEX idx_supplier_sessions_expires ON supplier_sessions(expires_at);
CREATE INDEX idx_supplier_readings_company ON supplier_mandatory_readings(company_id);
CREATE INDEX idx_supplier_reading_confirmations_supplier ON supplier_reading_confirmations(supplier_id);
CREATE INDEX idx_supplier_surveys_company ON supplier_surveys(company_id);
CREATE INDEX idx_supplier_survey_responses_supplier ON supplier_survey_responses(supplier_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_supplier_mandatory_readings_updated_at
  BEFORE UPDATE ON supplier_mandatory_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_surveys_updated_at
  BEFORE UPDATE ON supplier_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();