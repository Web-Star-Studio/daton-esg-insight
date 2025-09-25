-- Criar tabelas para o módulo OPERAÇÃO

-- Cronogramas de manutenção de equipamentos
CREATE TABLE public.equipment_maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  maintenance_type VARCHAR(50) NOT NULL DEFAULT 'preventiva',
  frequency_days INTEGER NOT NULL,
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  responsible_user_id UUID,
  priority VARCHAR(20) NOT NULL DEFAULT 'media',
  estimated_cost NUMERIC(10,2),
  estimated_duration_hours INTEGER,
  maintenance_checklist JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de manutenção realizadas
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  schedule_id UUID,
  maintenance_type VARCHAR(50) NOT NULL,
  maintenance_date DATE NOT NULL,
  performed_by_user_id UUID,
  actual_cost NUMERIC(10,2),
  actual_duration_hours INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'concluida',
  description TEXT,
  issues_found TEXT,
  parts_replaced JSONB DEFAULT '[]'::jsonb,
  next_recommended_date DATE,
  evidence_files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cronogramas de calibração
CREATE TABLE public.calibration_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  calibration_standard VARCHAR(100),
  frequency_months INTEGER NOT NULL DEFAULT 12,
  last_calibration_date DATE,
  next_calibration_date DATE NOT NULL,
  calibration_provider VARCHAR(255),
  certificate_required BOOLEAN NOT NULL DEFAULT true,
  tolerance_range JSONB DEFAULT '{}'::jsonb,
  responsible_user_id UUID,
  estimated_cost NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de calibração
CREATE TABLE public.calibration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  schedule_id UUID,
  calibration_date DATE NOT NULL,
  calibration_provider VARCHAR(255),
  certificate_number VARCHAR(100),
  certificate_file_path TEXT,
  calibration_result VARCHAR(20) NOT NULL DEFAULT 'aprovado',
  measurements_before JSONB DEFAULT '{}'::jsonb,
  measurements_after JSONB DEFAULT '{}'::jsonb,
  adjustments_made TEXT,
  next_calibration_date DATE,
  performed_by_user_id UUID,
  actual_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mapeamento da cadeia de valor
CREATE TABLE public.value_chain_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  process_name VARCHAR(255) NOT NULL,
  process_type VARCHAR(50) NOT NULL DEFAULT 'principal',
  input_description TEXT,
  output_description TEXT,
  internal_client VARCHAR(255),
  internal_supplier VARCHAR(255),
  external_suppliers JSONB DEFAULT '[]'::jsonb,
  external_clients JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb,
  responsible_user_id UUID,
  process_owner_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relacionamentos cliente-fornecedor interno
CREATE TABLE public.internal_client_supplier_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  client_department VARCHAR(255) NOT NULL,
  supplier_department VARCHAR(255) NOT NULL,
  service_description TEXT NOT NULL,
  sla_requirements JSONB DEFAULT '{}'::jsonb,
  communication_protocol TEXT,
  escalation_matrix JSONB DEFAULT '[]'::jsonb,
  performance_indicators JSONB DEFAULT '[]'::jsonb,
  relationship_manager_user_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avaliações de cliente interno
CREATE TABLE public.internal_client_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  relationship_id UUID NOT NULL,
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  overall_satisfaction_score INTEGER CHECK (overall_satisfaction_score >= 1 AND overall_satisfaction_score <= 10),
  service_quality_score INTEGER CHECK (service_quality_score >= 1 AND service_quality_score <= 10),
  response_time_score INTEGER CHECK (response_time_score >= 1 AND response_time_score <= 10),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 10),
  problem_resolution_score INTEGER CHECK (problem_resolution_score >= 1 AND problem_resolution_score <= 10),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  evaluated_by_user_id UUID NOT NULL,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de propriedade de ativos
CREATE TABLE public.asset_ownership_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  ownership_type VARCHAR(50) NOT NULL DEFAULT 'proprio',
  owner_company_name VARCHAR(255),
  owner_contact_info JSONB DEFAULT '{}'::jsonb,
  ownership_start_date DATE NOT NULL,
  ownership_end_date DATE,
  contract_number VARCHAR(100),
  contract_file_path TEXT,
  insurance_policy_number VARCHAR(100),
  insurance_coverage_amount NUMERIC(15,2),
  maintenance_responsibility VARCHAR(50) NOT NULL DEFAULT 'owner',
  usage_restrictions TEXT,
  return_conditions TEXT,
  responsible_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Acordos de empréstimo/comodato
CREATE TABLE public.loan_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  agreement_type VARCHAR(50) NOT NULL DEFAULT 'comodato',
  lender_company_name VARCHAR(255) NOT NULL,
  borrower_company_name VARCHAR(255) NOT NULL,
  loan_start_date DATE NOT NULL,
  loan_end_date DATE,
  renewal_terms TEXT,
  return_condition_requirements TEXT,
  insurance_requirements TEXT,
  usage_limitations TEXT,
  penalty_conditions TEXT,
  responsible_user_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_chain_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_client_supplier_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_client_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_ownership_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_agreements ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para company_id
CREATE POLICY "Users can manage their company maintenance schedules" ON public.equipment_maintenance_schedules FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company maintenance records" ON public.maintenance_records FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company calibration schedules" ON public.calibration_schedules FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company calibration records" ON public.calibration_records FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company value chain" ON public.value_chain_mapping FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company internal relationships" ON public.internal_client_supplier_relationships FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company internal evaluations" ON public.internal_client_evaluations FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company ownership records" ON public.asset_ownership_records FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company loan agreements" ON public.loan_agreements FOR ALL USING (company_id = get_user_company_id());

-- Criar triggers para updated_at
CREATE TRIGGER update_equipment_maintenance_schedules_updated_at BEFORE UPDATE ON public.equipment_maintenance_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calibration_schedules_updated_at BEFORE UPDATE ON public.calibration_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calibration_records_updated_at BEFORE UPDATE ON public.calibration_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_value_chain_mapping_updated_at BEFORE UPDATE ON public.value_chain_mapping FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internal_client_supplier_relationships_updated_at BEFORE UPDATE ON public.internal_client_supplier_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internal_client_evaluations_updated_at BEFORE UPDATE ON public.internal_client_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_ownership_records_updated_at BEFORE UPDATE ON public.asset_ownership_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loan_agreements_updated_at BEFORE UPDATE ON public.loan_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();