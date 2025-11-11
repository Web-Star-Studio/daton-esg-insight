-- Enum para fontes de água (GRI 303-3)
CREATE TYPE public.water_source_type_enum AS ENUM (
  'Superficial - Rio/Lago',
  'Superficial - Reservatório',
  'Subterrânea - Poço Artesiano',
  'Subterrânea - Poço Cacimba',
  'Água de Chuva',
  'Água de Reuso/Reciclada',
  'Água do Mar',
  'Produzida/Água de Processo',
  'Terceiros - Rede Pública',
  'Terceiros - Caminhão Pipa',
  'Outras Fontes'
);

-- Enum para qualidade da água
CREATE TYPE public.water_quality_enum AS ENUM (
  'Potável',
  'Industrial',
  'Água Doce (≤1.000 mg/L TDS)',
  'Água Salobra (>1.000 mg/L TDS)',
  'Água Salgada (>35.000 mg/L TDS)',
  'Outra'
);

-- Tabela principal de consumo de água
CREATE TABLE public.water_consumption_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Período de referência
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  
  -- Fonte de água (GRI 303-3)
  source_type public.water_source_type_enum NOT NULL,
  source_name VARCHAR(255),
  source_location VARCHAR(255),
  
  -- Volumes (m³)
  withdrawal_volume_m3 DECIMAL(15,3) NOT NULL CHECK (withdrawal_volume_m3 >= 0),
  consumption_volume_m3 DECIMAL(15,3) CHECK (consumption_volume_m3 >= 0),
  discharge_volume_m3 DECIMAL(15,3) CHECK (discharge_volume_m3 >= 0),
  
  -- Características da água
  water_quality public.water_quality_enum,
  total_dissolved_solids_mg_l DECIMAL(10,2),
  is_water_stressed_area BOOLEAN DEFAULT false,
  
  -- Metadados de coleta
  measurement_method VARCHAR(100),
  data_source VARCHAR(255),
  source_document VARCHAR(255),
  invoice_number VARCHAR(100),
  meter_reading_start DECIMAL(12,3),
  meter_reading_end DECIMAL(12,3),
  
  -- Compliance e certificações
  has_water_permit BOOLEAN DEFAULT false,
  permit_number VARCHAR(100),
  permit_expiry_date DATE,
  
  -- Observações
  notes TEXT,
  data_quality_score DECIMAL(3,1) CHECK (data_quality_score >= 0 AND data_quality_score <= 10),
  
  -- Auditoria
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date),
  CONSTRAINT consumption_less_than_withdrawal CHECK (consumption_volume_m3 IS NULL OR consumption_volume_m3 <= withdrawal_volume_m3),
  CONSTRAINT discharge_less_than_withdrawal CHECK (discharge_volume_m3 IS NULL OR discharge_volume_m3 <= withdrawal_volume_m3)
);

-- Índices para performance
CREATE INDEX idx_water_consumption_company ON public.water_consumption_data(company_id);
CREATE INDEX idx_water_consumption_period ON public.water_consumption_data(year, month);
CREATE INDEX idx_water_consumption_dates ON public.water_consumption_data(period_start_date, period_end_date);
CREATE INDEX idx_water_consumption_source_type ON public.water_consumption_data(source_type);

-- RLS
ALTER TABLE public.water_consumption_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company water data"
  ON public.water_consumption_data FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_water_consumption_data_updated_at
  BEFORE UPDATE ON public.water_consumption_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campos calculados em gri_environmental_data_collection
ALTER TABLE public.gri_environmental_data_collection
  ADD COLUMN IF NOT EXISTS water_withdrawal_public_network_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_withdrawal_well_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_withdrawal_surface_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_withdrawal_reuse_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_withdrawal_other_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_discharge_total_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_stressed_areas_m3 DECIMAL(15,3),
  ADD COLUMN IF NOT EXISTS water_calculation_date TIMESTAMPTZ;

-- Comentários
COMMENT ON TABLE public.water_consumption_data IS 'Dados detalhados de consumo de água por fonte (GRI 303-3, 303-5)';
COMMENT ON COLUMN public.water_consumption_data.withdrawal_volume_m3 IS 'Volume total de água retirada da fonte (m³) - GRI 303-3';
COMMENT ON COLUMN public.water_consumption_data.consumption_volume_m3 IS 'Volume consumido = retirada - devolução (m³) - GRI 303-5';
COMMENT ON COLUMN public.water_consumption_data.discharge_volume_m3 IS 'Volume devolvido/descartado (m³) - GRI 303-4';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_withdrawal_public_network_m3 IS 'Água retirada de rede pública (m³)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_withdrawal_well_m3 IS 'Água retirada de poços (m³)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_withdrawal_surface_m3 IS 'Água retirada de rios/lagos (m³)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_withdrawal_reuse_m3 IS 'Água de reuso (m³)';
COMMENT ON COLUMN public.gri_environmental_data_collection.water_stressed_areas_m3 IS 'Água retirada de áreas com estresse hídrico (m³)';