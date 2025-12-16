-- =====================================================
-- SISTEMA DE AVALIAÇÕES DE FORNECEDORES [ALX], [AVA1], [AVA2]
-- =====================================================

-- 1. TABELA DE PRODUTOS/SERVIÇOS [ALX]
CREATE TABLE public.supplier_products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('produto', 'servico')),
  description TEXT,
  category TEXT,
  unit_of_measure TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ADICIONAR COLUNAS EM supplier_document_submissions
ALTER TABLE public.supplier_document_submissions 
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exempt_reason TEXT,
ADD COLUMN IF NOT EXISTS next_evaluation_date DATE,
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'Ativo' CHECK (evaluation_status IN ('Ativo', 'Inativo'));

-- 3. TABELA DE AVALIAÇÕES DOCUMENTAIS [AVA1]
CREATE TABLE public.supplier_document_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_weight_required INTEGER DEFAULT 0,
  total_weight_achieved INTEGER DEFAULT 0,
  compliance_percentage DECIMAL(5,2) DEFAULT 0,
  next_evaluation_date DATE,
  observation TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  supplier_status TEXT DEFAULT 'Ativo' CHECK (supplier_status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE AVALIAÇÕES DE DESEMPENHO [AVA2]
CREATE TABLE public.supplier_performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  product_service_id UUID NOT NULL REFERENCES supplier_products_services(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  delivery_score INTEGER CHECK (delivery_score BETWEEN 1 AND 5),
  price_score INTEGER CHECK (price_score BETWEEN 1 AND 5),
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  compliance_score INTEGER CHECK (compliance_score BETWEEN 1 AND 5),
  overall_score DECIMAL(3,2),
  observation TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA DE ALERTAS DE VENCIMENTO
CREATE TABLE public.supplier_expiration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES supplier_management(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('documento', 'treinamento', 'avaliacao')),
  reference_id UUID NOT NULL,
  reference_name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER,
  alert_status TEXT DEFAULT 'Pendente' CHECK (alert_status IN ('Pendente', 'Visualizado', 'Resolvido')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDICES
CREATE INDEX idx_supplier_products_services_supplier ON supplier_products_services(supplier_id);
CREATE INDEX idx_supplier_products_services_company ON supplier_products_services(company_id);
CREATE INDEX idx_supplier_document_evaluations_supplier ON supplier_document_evaluations(supplier_id);
CREATE INDEX idx_supplier_performance_evaluations_supplier ON supplier_performance_evaluations(supplier_id);
CREATE INDEX idx_supplier_expiration_alerts_company ON supplier_expiration_alerts(company_id);
CREATE INDEX idx_supplier_expiration_alerts_status ON supplier_expiration_alerts(alert_status);

-- RLS
ALTER TABLE public.supplier_products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_document_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_expiration_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para supplier_products_services
CREATE POLICY "Users can view products/services from their company"
ON public.supplier_products_services FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert products/services for their company"
ON public.supplier_products_services FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update products/services from their company"
ON public.supplier_products_services FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete products/services from their company"
ON public.supplier_products_services FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Políticas para supplier_document_evaluations
CREATE POLICY "Users can view document evaluations from their company"
ON public.supplier_document_evaluations FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert document evaluations for their company"
ON public.supplier_document_evaluations FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update document evaluations from their company"
ON public.supplier_document_evaluations FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Políticas para supplier_performance_evaluations
CREATE POLICY "Users can view performance evaluations from their company"
ON public.supplier_performance_evaluations FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert performance evaluations for their company"
ON public.supplier_performance_evaluations FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update performance evaluations from their company"
ON public.supplier_performance_evaluations FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Políticas para supplier_expiration_alerts
CREATE POLICY "Users can view expiration alerts from their company"
ON public.supplier_expiration_alerts FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert expiration alerts for their company"
ON public.supplier_expiration_alerts FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update expiration alerts from their company"
ON public.supplier_expiration_alerts FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete expiration alerts from their company"
ON public.supplier_expiration_alerts FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));