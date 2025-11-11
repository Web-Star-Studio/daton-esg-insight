-- Criar tabela operational_metrics para armazenar dados de produção/operação
CREATE TABLE IF NOT EXISTS public.operational_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Período de referência
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Métricas de produção (múltiplas unidades suportadas)
  production_volume DECIMAL(15,3),
  production_unit TEXT, -- Ex: 'toneladas', 'unidades', 'kg', 'm³', 'litros'
  production_type TEXT, -- Ex: 'Produto A', 'Produto B', 'Serviço X'
  
  -- Métricas operacionais
  distance_traveled_km DECIMAL(15,2), -- Para transportadoras
  operational_hours DECIMAL(12,2), -- Horas de operação
  service_units DECIMAL(15,2), -- Unidades de serviço prestadas
  
  -- Métricas financeiras (para intensidade por receita)
  revenue_brl DECIMAL(18,2), -- Receita bruta no período
  revenue_currency TEXT DEFAULT 'BRL',
  
  -- Métricas de área (para intensidade por m²)
  operational_area_m2 DECIMAL(12,2),
  
  -- Metadados
  notes TEXT,
  data_source TEXT, -- 'ERP', 'SAP', 'Manual', 'Planilha'
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date),
  CONSTRAINT unique_company_period UNIQUE (company_id, period_start_date, period_end_date, production_type)
);

-- Índices para performance
CREATE INDEX idx_operational_metrics_company ON public.operational_metrics(company_id);
CREATE INDEX idx_operational_metrics_period ON public.operational_metrics(year, month);
CREATE INDEX idx_operational_metrics_dates ON public.operational_metrics(period_start_date, period_end_date);

-- RLS policies
ALTER TABLE public.operational_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company operational metrics"
  ON public.operational_metrics FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_operational_metrics_updated_at
  BEFORE UPDATE ON public.operational_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campos de intensidade energética em gri_environmental_data_collection
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS energy_intensity_kwh_per_unit DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS energy_intensity_unit TEXT,
  ADD COLUMN IF NOT EXISTS energy_intensity_kwh_per_revenue DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS energy_intensity_kwh_per_km DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS energy_intensity_kwh_per_m2 DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS production_volume_reference DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS production_unit_reference TEXT;