-- ===========================================
-- CRITÉRIOS DE AVALIAÇÃO CONFIGURÁVEIS [AVA2]
-- ===========================================

-- Tabela de critérios de avaliação (configurável por empresa)
CREATE TABLE IF NOT EXISTS supplier_evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração geral de avaliação por empresa
CREATE TABLE IF NOT EXISTS supplier_evaluation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  minimum_approval_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nova estrutura para AVA2 com critérios
CREATE TABLE IF NOT EXISTS supplier_criteria_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES supplier_management(id) ON DELETE CASCADE NOT NULL,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  total_weight INTEGER NOT NULL,
  achieved_weight INTEGER NOT NULL,
  minimum_required INTEGER,
  is_approved BOOLEAN NOT NULL,
  observation TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens individuais da avaliação
CREATE TABLE IF NOT EXISTS supplier_criteria_evaluation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES supplier_criteria_evaluations(id) ON DELETE CASCADE NOT NULL,
  criteria_id UUID REFERENCES supplier_evaluation_criteria(id),
  criteria_name VARCHAR(200) NOT NULL,
  weight INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ATENDE', 'NAO_ATENDE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE supplier_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_criteria_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_criteria_evaluation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_evaluation_criteria
CREATE POLICY "Users can view criteria for their company"
ON supplier_evaluation_criteria FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage criteria for their company"
ON supplier_evaluation_criteria FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for supplier_evaluation_config
CREATE POLICY "Users can view config for their company"
ON supplier_evaluation_config FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage config for their company"
ON supplier_evaluation_config FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for supplier_criteria_evaluations
CREATE POLICY "Users can view evaluations for their company"
ON supplier_criteria_evaluations FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage evaluations for their company"
ON supplier_criteria_evaluations FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for supplier_criteria_evaluation_items
CREATE POLICY "Users can view evaluation items"
ON supplier_criteria_evaluation_items FOR SELECT
USING (evaluation_id IN (
  SELECT id FROM supplier_criteria_evaluations 
  WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can manage evaluation items"
ON supplier_criteria_evaluation_items FOR ALL
USING (evaluation_id IN (
  SELECT id FROM supplier_criteria_evaluations 
  WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
));

-- Indexes
CREATE INDEX idx_supplier_evaluation_criteria_company ON supplier_evaluation_criteria(company_id);
CREATE INDEX idx_supplier_criteria_evaluations_supplier ON supplier_criteria_evaluations(supplier_id);
CREATE INDEX idx_supplier_criteria_evaluations_company ON supplier_criteria_evaluations(company_id);
CREATE INDEX idx_supplier_criteria_evaluation_items_evaluation ON supplier_criteria_evaluation_items(evaluation_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_supplier_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_evaluation_criteria_updated_at
BEFORE UPDATE ON supplier_evaluation_criteria
FOR EACH ROW EXECUTE FUNCTION update_supplier_criteria_updated_at();

CREATE TRIGGER trigger_supplier_evaluation_config_updated_at
BEFORE UPDATE ON supplier_evaluation_config
FOR EACH ROW EXECUTE FUNCTION update_supplier_criteria_updated_at();