-- Criar tabela de comunicações com stakeholders
CREATE TABLE stakeholder_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'meeting', 'phone', 'survey', 'document')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')) DEFAULT 'outbound',
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'replied', 'scheduled')) DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  scheduled_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  template_id TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_stakeholder_communications_company ON stakeholder_communications(company_id);
CREATE INDEX idx_stakeholder_communications_stakeholder ON stakeholder_communications(stakeholder_id);
CREATE INDEX idx_stakeholder_communications_status ON stakeholder_communications(status);
CREATE INDEX idx_stakeholder_communications_type ON stakeholder_communications(type);
CREATE INDEX idx_stakeholder_communications_created_at ON stakeholder_communications(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON stakeholder_communications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE stakeholder_communications ENABLE ROW LEVEL SECURITY;

-- Usuários podem gerenciar comunicações da própria empresa
CREATE POLICY "Users can manage communications from their company"
  ON stakeholder_communications FOR ALL
  USING (company_id = get_user_company_id());