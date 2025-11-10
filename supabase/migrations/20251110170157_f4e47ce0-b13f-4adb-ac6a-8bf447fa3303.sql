-- Criar tabela para coleta de dados ambientais
CREATE TABLE gri_environmental_data_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Pergunta 1: Inventário de Emissões GEE
  has_ghg_inventory BOOLEAN DEFAULT false,
  ghg_inventory_year INTEGER,
  ghg_inventory_methodology TEXT,
  ghg_inventory_last_update DATE,
  ghg_inventory_notes TEXT,
  
  -- Pergunta 2: Controle de Energia e Combustíveis
  has_energy_controls BOOLEAN DEFAULT false,
  energy_monitoring_systems TEXT[],
  energy_control_notes TEXT,
  
  -- Pergunta 3: Água e Efluentes
  has_water_monitoring BOOLEAN DEFAULT false,
  water_sources TEXT[],
  has_effluent_treatment BOOLEAN DEFAULT false,
  effluent_treatment_type TEXT,
  water_notes TEXT,
  
  -- Pergunta 4: Gestão de Resíduos
  has_waste_controls BOOLEAN DEFAULT false,
  waste_management_plan_exists BOOLEAN DEFAULT false,
  waste_segregation_practices TEXT[],
  waste_notes TEXT,
  
  -- Pergunta 5: Licenças e Certificações
  has_environmental_licenses BOOLEAN DEFAULT false,
  has_iso_14001 BOOLEAN DEFAULT false,
  iso_14001_certification_date DATE,
  iso_14001_certifier TEXT,
  licenses_notes TEXT,
  
  -- DADOS QUANTITATIVOS (GRI 302, 303, 305, 306)
  
  -- GRI 302: Energia
  energy_total_consumption_kwh DECIMAL(15,2),
  energy_renewable_percentage DECIMAL(5,2),
  energy_intensity_kwh_per_revenue DECIMAL(10,4),
  
  -- GRI 303: Água
  water_total_withdrawal_m3 DECIMAL(15,2),
  water_consumption_m3 DECIMAL(15,2),
  water_recycled_percentage DECIMAL(5,2),
  water_intensity_m3_per_product DECIMAL(10,4),
  
  -- GRI 305: Emissões
  emissions_scope1_tco2e DECIMAL(15,3),
  emissions_scope2_tco2e DECIMAL(15,3),
  emissions_scope3_tco2e DECIMAL(15,3),
  emissions_total_tco2e DECIMAL(15,3),
  emissions_intensity_tco2e_per_revenue DECIMAL(10,4),
  emissions_biogenic_tco2 DECIMAL(15,3),
  
  -- GRI 306: Resíduos
  waste_total_generated_tonnes DECIMAL(15,3),
  waste_hazardous_tonnes DECIMAL(15,3),
  waste_non_hazardous_tonnes DECIMAL(15,3),
  waste_recycled_percentage DECIMAL(5,2),
  waste_landfill_percentage DECIMAL(5,2),
  waste_incineration_percentage DECIMAL(5,2),
  
  -- Benchmarks e Comparações
  sector_average_energy_intensity DECIMAL(10,4),
  sector_average_emissions_intensity DECIMAL(10,4),
  sector_average_recycling_rate DECIMAL(5,2),
  
  -- Análise da IA
  ai_analysis JSONB,
  ai_generated_text TEXT,
  ai_confidence_score DECIMAL(5,2),
  ai_last_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  -- Checklist de documentos
  documents_checklist JSONB,
  
  -- Metadados
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_gri_env_data_report_id ON gri_environmental_data_collection(report_id);
CREATE INDEX idx_gri_env_data_company_id ON gri_environmental_data_collection(company_id);

-- RLS Policies
ALTER TABLE gri_environmental_data_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company environmental data"
  ON gri_environmental_data_collection FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company environmental data"
  ON gri_environmental_data_collection FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company environmental data"
  ON gri_environmental_data_collection FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));