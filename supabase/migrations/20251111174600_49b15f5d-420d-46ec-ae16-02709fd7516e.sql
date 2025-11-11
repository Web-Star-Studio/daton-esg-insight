-- Criar tabela para monitoramento de energia
CREATE TABLE IF NOT EXISTS public.energy_consumption_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Fontes de energia
  energy_source_type VARCHAR(100) NOT NULL, -- 'Rede Elétrica', 'Solar', 'Diesel', 'Gasolina', 'GLP', 'Biomassa', etc.
  energy_source_name VARCHAR(255),
  
  -- Consumo
  consumption_value NUMERIC NOT NULL,
  consumption_unit VARCHAR(50) NOT NULL, -- 'kWh', 'litros', 'kg', 'MWh', 'GJ'
  
  -- Classificação
  is_renewable BOOLEAN DEFAULT false,
  is_from_grid BOOLEAN DEFAULT false,
  is_self_generated BOOLEAN DEFAULT false,
  
  -- Custos
  cost_brl NUMERIC,
  
  -- Intensidade energética
  production_volume NUMERIC,
  production_unit VARCHAR(50),
  revenue_brl NUMERIC,
  
  -- Metadados
  notes TEXT,
  data_source VARCHAR(255),
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verification_date TIMESTAMPTZ,
  
  UNIQUE(company_id, year, period_start_date, energy_source_type, energy_source_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_energy_consumption_company_year ON public.energy_consumption_data(company_id, year);
CREATE INDEX IF NOT EXISTS idx_energy_consumption_dates ON public.energy_consumption_data(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_energy_consumption_source ON public.energy_consumption_data(energy_source_type);

-- RLS Policies
ALTER TABLE public.energy_consumption_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view energy data from their company"
  ON public.energy_consumption_data
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert energy data for their company"
  ON public.energy_consumption_data
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update energy data from their company"
  ON public.energy_consumption_data
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete energy data from their company"
  ON public.energy_consumption_data
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_energy_consumption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_energy_consumption_updated_at
  BEFORE UPDATE ON public.energy_consumption_data
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_consumption_updated_at();