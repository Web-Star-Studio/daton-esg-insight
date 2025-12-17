-- =====================================================
-- FASE 2: CATEGORIAS & TEMPLATES DE AUDITORIA
-- =====================================================

-- 2.1 Categorias de Auditoria
CREATE TABLE IF NOT EXISTS audit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color_hex VARCHAR(7) DEFAULT '#3B82F6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Templates de Auditoria (Auditorias Padrão)
CREATE TABLE IF NOT EXISTS audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES audit_categories(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  default_audit_type VARCHAR(50) DEFAULT 'Interna',
  estimated_duration_hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Normas vinculadas ao Template (SGI - múltiplas normas)
CREATE TABLE IF NOT EXISTS audit_template_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES audit_templates(id) ON DELETE CASCADE NOT NULL,
  standard_id UUID REFERENCES audit_standards(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, standard_id)
);

-- 2.4 Planejamentos Padrão do Template
CREATE TABLE IF NOT EXISTS audit_template_plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES audit_templates(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  suggested_duration_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Itens dos Planejamentos Padrão
CREATE TABLE IF NOT EXISTS audit_template_planning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_planning_id UUID REFERENCES audit_template_plannings(id) ON DELETE CASCADE NOT NULL,
  standard_item_id UUID REFERENCES audit_standard_items(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_categories_company ON audit_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_company ON audit_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_template_standards_template ON audit_template_standards(template_id);
CREATE INDEX IF NOT EXISTS idx_template_plannings_template ON audit_template_plannings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_planning_items_planning ON audit_template_planning_items(template_planning_id);

-- RLS Policies
ALTER TABLE audit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_planning_items ENABLE ROW LEVEL SECURITY;

-- Policies para audit_categories
CREATE POLICY "Users can view categories from their company"
  ON audit_categories FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create categories for their company"
  ON audit_categories FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update categories from their company"
  ON audit_categories FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete categories from their company"
  ON audit_categories FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para audit_templates
CREATE POLICY "Users can view templates from their company"
  ON audit_templates FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create templates for their company"
  ON audit_templates FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update templates from their company"
  ON audit_templates FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete templates from their company"
  ON audit_templates FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para audit_template_standards
CREATE POLICY "Users can view template standards"
  ON audit_template_standards FOR SELECT
  USING (template_id IN (
    SELECT id FROM audit_templates 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage template standards"
  ON audit_template_standards FOR ALL
  USING (template_id IN (
    SELECT id FROM audit_templates 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_template_plannings
CREATE POLICY "Users can view template plannings"
  ON audit_template_plannings FOR SELECT
  USING (template_id IN (
    SELECT id FROM audit_templates 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage template plannings"
  ON audit_template_plannings FOR ALL
  USING (template_id IN (
    SELECT id FROM audit_templates 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

-- Policies para audit_template_planning_items
CREATE POLICY "Users can view template planning items"
  ON audit_template_planning_items FOR SELECT
  USING (template_planning_id IN (
    SELECT tp.id FROM audit_template_plannings tp
    JOIN audit_templates t ON tp.template_id = t.id
    WHERE t.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage template planning items"
  ON audit_template_planning_items FOR ALL
  USING (template_planning_id IN (
    SELECT tp.id FROM audit_template_plannings tp
    JOIN audit_templates t ON tp.template_id = t.id
    WHERE t.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  ));