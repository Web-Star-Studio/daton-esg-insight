-- Tabela de fornecimentos individuais (ALX)
CREATE TABLE public.supplier_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  supplier_id UUID REFERENCES public.supplier_management(id) ON DELETE CASCADE NOT NULL,
  supplier_type_id UUID REFERENCES public.supplier_types(id) ON DELETE SET NULL,
  business_unit_id UUID,
  
  -- Dados do fornecimento
  delivery_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  quantity DECIMAL(10,2),
  total_value DECIMAL(12,2),
  
  -- Status e avaliação
  status VARCHAR(30) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Avaliado', 'Problema')),
  evaluation_id UUID REFERENCES public.supplier_criteria_evaluations(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_supplier_deliveries_company ON public.supplier_deliveries(company_id);
CREATE INDEX idx_supplier_deliveries_supplier ON public.supplier_deliveries(supplier_id);
CREATE INDEX idx_supplier_deliveries_date ON public.supplier_deliveries(delivery_date);
CREATE INDEX idx_supplier_deliveries_status ON public.supplier_deliveries(status);

-- RLS
ALTER TABLE public.supplier_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company deliveries" 
  ON public.supplier_deliveries FOR ALL 
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_supplier_deliveries_updated_at
  BEFORE UPDATE ON public.supplier_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna delivery_id à tabela de avaliações para referência reversa
ALTER TABLE public.supplier_criteria_evaluations 
ADD COLUMN delivery_id UUID REFERENCES public.supplier_deliveries(id) ON DELETE SET NULL;