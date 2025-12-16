-- Tabela de vinculação fornecedor ↔ unidades
CREATE TABLE supplier_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  business_unit_id TEXT NOT NULL,
  is_corporate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, business_unit_id)
);

-- Tabela de vinculação fornecedor ↔ categorias
CREATE TABLE supplier_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES supplier_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, category_id)
);

-- Adicionar company_id na tabela supplier_type_assignments
ALTER TABLE supplier_type_assignments 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Índices para performance
CREATE INDEX idx_supplier_unit_assignments_supplier ON supplier_unit_assignments(supplier_id);
CREATE INDEX idx_supplier_unit_assignments_company ON supplier_unit_assignments(company_id);
CREATE INDEX idx_supplier_category_assignments_supplier ON supplier_category_assignments(supplier_id);
CREATE INDEX idx_supplier_category_assignments_company ON supplier_category_assignments(company_id);

-- Habilitar RLS
ALTER TABLE supplier_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_category_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para supplier_unit_assignments
CREATE POLICY "Users can view unit assignments from their company"
ON supplier_unit_assignments FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert unit assignments for their company"
ON supplier_unit_assignments FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update unit assignments from their company"
ON supplier_unit_assignments FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete unit assignments from their company"
ON supplier_unit_assignments FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para supplier_category_assignments
CREATE POLICY "Users can view category assignments from their company"
ON supplier_category_assignments FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert category assignments for their company"
ON supplier_category_assignments FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update category assignments from their company"
ON supplier_category_assignments FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete category assignments from their company"
ON supplier_category_assignments FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));