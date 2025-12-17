-- =====================================================
-- FASE 3: CRIAÇÃO & PLANEJAMENTO DE AUDITORIAS
-- =====================================================

-- 3.1 Expandir tabela audits com novos campos
ALTER TABLE audits ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES audit_categories(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES audit_templates(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS target_entity VARCHAR(200);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS target_entity_type VARCHAR(50);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS planning_status VARCHAR(20) DEFAULT 'draft' 
  CHECK (planning_status IN ('draft', 'in_planning', 'finalized', 'locked'));
ALTER TABLE audits ADD COLUMN IF NOT EXISTS planning_locked_at TIMESTAMPTZ;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS planning_locked_by UUID REFERENCES auth.users(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS responded_items INTEGER DEFAULT 0;

-- 3.2 Sessões de Auditoria (Planejamentos)
CREATE TABLE IF NOT EXISTS audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  session_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(200),
  auditor_id UUID REFERENCES auth.users(id),
  auditee_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  responded_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Participantes da Sessão
CREATE TABLE IF NOT EXISTS audit_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  external_name VARCHAR(200),
  external_email VARCHAR(200),
  role VARCHAR(50) NOT NULL CHECK (role IN ('lead_auditor', 'auditor', 'auditee', 'observer', 'expert')),
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Link entre Auditoria e Normas (snapshot no momento do lock)
CREATE TABLE IF NOT EXISTS audit_standards_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  standard_id UUID REFERENCES audit_standards(id) NOT NULL,
  standard_snapshot JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audit_id, standard_id)
);

-- 3.5 Itens da Sessão (quais itens serão auditados em cada sessão)
CREATE TABLE IF NOT EXISTS audit_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE NOT NULL,
  standard_item_id UUID REFERENCES audit_standard_items(id) NOT NULL,
  audit_standards_link_id UUID REFERENCES audit_standards_link(id) ON DELETE CASCADE,
  item_snapshot JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, standard_item_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audits_category ON audits(category_id);
CREATE INDEX IF NOT EXISTS idx_audits_template ON audits(template_id);
CREATE INDEX IF NOT EXISTS idx_audits_planning_status ON audits(planning_status);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_audit ON audit_sessions(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_status ON audit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_audit_session_participants_session ON audit_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_standards_link_audit ON audit_standards_link(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_session_items_session ON audit_session_items(session_id);

-- RLS Policies
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_standards_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_session_items ENABLE ROW LEVEL SECURITY;

-- Policies para audit_sessions
CREATE POLICY "Users can view sessions from their company audits"
  ON audit_sessions FOR SELECT
  USING (audit_id IN (
    SELECT id FROM audits 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage sessions from their company audits"
  ON audit_sessions FOR ALL
  USING (audit_id IN (
    SELECT id FROM audits 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_session_participants
CREATE POLICY "Users can view participants from their company"
  ON audit_session_participants FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM audit_sessions s
    JOIN audits a ON s.audit_id = a.id
    WHERE a.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage participants from their company"
  ON audit_session_participants FOR ALL
  USING (session_id IN (
    SELECT s.id FROM audit_sessions s
    JOIN audits a ON s.audit_id = a.id
    WHERE a.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_standards_link
CREATE POLICY "Users can view standards link from their company"
  ON audit_standards_link FOR SELECT
  USING (audit_id IN (
    SELECT id FROM audits 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage standards link from their company"
  ON audit_standards_link FOR ALL
  USING (audit_id IN (
    SELECT id FROM audits 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_session_items
CREATE POLICY "Users can view session items from their company"
  ON audit_session_items FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM audit_sessions s
    JOIN audits a ON s.audit_id = a.id
    WHERE a.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage session items from their company"
  ON audit_session_items FOR ALL
  USING (session_id IN (
    SELECT s.id FROM audit_sessions s
    JOIN audits a ON s.audit_id = a.id
    WHERE a.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Função para finalizar planejamento e criar snapshots
CREATE OR REPLACE FUNCTION finalize_audit_planning(p_audit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_audit RECORD;
  v_standard RECORD;
  v_item RECORD;
  v_total_items INTEGER := 0;
BEGIN
  -- Verificar se a auditoria existe e está em planejamento
  SELECT * INTO v_audit FROM audits WHERE id = p_audit_id;
  
  IF v_audit IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auditoria não encontrada');
  END IF;
  
  IF v_audit.planning_status = 'locked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Planejamento já está bloqueado');
  END IF;
  
  -- Criar snapshots das normas vinculadas
  FOR v_standard IN 
    SELECT asl.*, s.* 
    FROM audit_standards_link asl
    JOIN audit_standards s ON asl.standard_id = s.id
    WHERE asl.audit_id = p_audit_id
  LOOP
    UPDATE audit_standards_link
    SET standard_snapshot = to_jsonb(v_standard)
    WHERE id = v_standard.id;
  END LOOP;
  
  -- Criar snapshots dos itens nas sessões
  FOR v_item IN
    SELECT asi.*, si.*
    FROM audit_session_items asi
    JOIN audit_standard_items si ON asi.standard_item_id = si.id
    WHERE asi.session_id IN (SELECT id FROM audit_sessions WHERE audit_id = p_audit_id)
  LOOP
    UPDATE audit_session_items
    SET item_snapshot = to_jsonb(v_item)
    WHERE id = v_item.id;
    
    v_total_items := v_total_items + 1;
  END LOOP;
  
  -- Atualizar status da auditoria
  UPDATE audits
  SET 
    planning_status = 'locked',
    planning_locked_at = NOW(),
    planning_locked_by = auth.uid(),
    total_items = v_total_items,
    updated_at = NOW()
  WHERE id = p_audit_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'total_items', v_total_items,
    'locked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;