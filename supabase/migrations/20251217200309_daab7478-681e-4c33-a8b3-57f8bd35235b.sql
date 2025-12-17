-- =====================================================
-- FASE 1: GOVERNANÇA & NORMAS (Standards Engine)
-- =====================================================

-- 1.1 Tipos de Resposta Customizáveis
CREATE TABLE IF NOT EXISTS audit_response_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_es VARCHAR(100),
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- 1.2 Opções de Resposta
CREATE TABLE IF NOT EXISTS audit_response_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_type_id UUID REFERENCES audit_response_types(id) ON DELETE CASCADE NOT NULL,
  label VARCHAR(100) NOT NULL,
  label_en VARCHAR(100),
  label_es VARCHAR(100),
  adherence_value INTEGER DEFAULT 0 CHECK (adherence_value >= 0 AND adherence_value <= 100),
  is_not_counted BOOLEAN DEFAULT FALSE,
  triggers_occurrence BOOLEAN DEFAULT FALSE,
  color_hex VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Normas/Standards
CREATE TABLE IF NOT EXISTS audit_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  name_es VARCHAR(200),
  version VARCHAR(50),
  description TEXT,
  response_type_id UUID REFERENCES audit_response_types(id),
  calculation_method VARCHAR(20) NOT NULL DEFAULT 'weight_based'
    CHECK (calculation_method IN ('weight_based', 'quantity_based')),
  auto_numbering BOOLEAN DEFAULT TRUE,
  allow_partial_response BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- 1.4 Itens da Norma (Hierárquico)
CREATE TABLE IF NOT EXISTS audit_standard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id UUID REFERENCES audit_standards(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES audit_standard_items(id) ON DELETE CASCADE,
  item_number VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  field_type VARCHAR(20) NOT NULL DEFAULT 'question'
    CHECK (field_type IN ('question', 'guidance', 'text')),
  weight INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT FALSE,
  requires_justification BOOLEAN DEFAULT FALSE,
  guidance_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_response_types_company ON audit_response_types(company_id);
CREATE INDEX IF NOT EXISTS idx_response_options_type ON audit_response_options(response_type_id);
CREATE INDEX IF NOT EXISTS idx_standards_company ON audit_standards(company_id);
CREATE INDEX IF NOT EXISTS idx_standard_items_standard ON audit_standard_items(standard_id);
CREATE INDEX IF NOT EXISTS idx_standard_items_parent ON audit_standard_items(parent_id);

-- RLS Policies
ALTER TABLE audit_response_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_response_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_standard_items ENABLE ROW LEVEL SECURITY;

-- Policies para audit_response_types
CREATE POLICY "Users can view response types from their company"
  ON audit_response_types FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create response types for their company"
  ON audit_response_types FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update response types from their company"
  ON audit_response_types FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete response types from their company"
  ON audit_response_types FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) AND is_system = FALSE);

-- Policies para audit_response_options
CREATE POLICY "Users can view response options"
  ON audit_response_options FOR SELECT
  USING (response_type_id IN (
    SELECT id FROM audit_response_types 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage response options"
  ON audit_response_options FOR ALL
  USING (response_type_id IN (
    SELECT id FROM audit_response_types 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_standards
CREATE POLICY "Users can view standards from their company"
  ON audit_standards FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create standards for their company"
  ON audit_standards FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update standards from their company"
  ON audit_standards FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete standards from their company"
  ON audit_standards FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para audit_standard_items
CREATE POLICY "Users can view standard items"
  ON audit_standard_items FOR SELECT
  USING (standard_id IN (
    SELECT id FROM audit_standards 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage standard items"
  ON audit_standard_items FOR ALL
  USING (standard_id IN (
    SELECT id FROM audit_standards 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));