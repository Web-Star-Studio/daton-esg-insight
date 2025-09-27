-- Create tables for compliance and ESG frameworks

-- IFRS Disclosures
CREATE TABLE IF NOT EXISTS public.ifrs_disclosures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    disclosure_id TEXT NOT NULL,
    disclosure_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'general' or 'climate'
    requirement_type TEXT NOT NULL, -- 'mandatory' or 'conditional'
    disclosure_content TEXT,
    quantitative_data JSONB DEFAULT '{}',
    qualitative_description TEXT,
    data_sources TEXT[],
    assurance_level TEXT,
    reporting_period_start DATE,
    reporting_period_end DATE,
    status TEXT DEFAULT 'draft', -- 'draft', 'under_review', 'approved', 'published'
    completeness_score INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SASB Metrics
CREATE TABLE IF NOT EXISTS public.sasb_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    industry_code TEXT NOT NULL,
    metric_code TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    sustainability_dimension TEXT NOT NULL, -- 'Environment', 'Social Capital', 'Human Capital', 'Business Model & Innovation', 'Leadership & Governance'
    disclosure_topic TEXT NOT NULL,
    accounting_metric TEXT NOT NULL,
    unit_of_measure TEXT,
    quantitative_value NUMERIC,
    qualitative_description TEXT,
    data_source TEXT,
    methodology TEXT,
    reporting_period_start DATE,
    reporting_period_end DATE,
    status TEXT DEFAULT 'draft',
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TCFD Disclosures
CREATE TABLE IF NOT EXISTS public.tcfd_disclosures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    pillar TEXT NOT NULL, -- 'governance', 'strategy', 'risk_management', 'metrics_targets'
    recommendation_id TEXT NOT NULL,
    recommendation_title TEXT NOT NULL,
    disclosure_content TEXT,
    implementation_status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    maturity_level TEXT DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced'
    supporting_evidence TEXT[],
    quantitative_metrics JSONB DEFAULT '{}',
    scenario_analysis JSONB DEFAULT '{}',
    time_horizon TEXT,
    reporting_period_start DATE,
    reporting_period_end DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ESRS Disclosures (CSRD)
CREATE TABLE IF NOT EXISTS public.esrs_disclosures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    esrs_standard TEXT NOT NULL, -- 'ESRS-E1', 'ESRS-E2', etc.
    disclosure_requirement TEXT NOT NULL,
    disclosure_title TEXT NOT NULL,
    sustainability_matter TEXT NOT NULL,
    materiality_assessment JSONB DEFAULT '{}',
    disclosure_content TEXT,
    quantitative_data JSONB DEFAULT '{}',
    policies_actions JSONB DEFAULT '{}',
    targets_measures JSONB DEFAULT '{}',
    data_sources TEXT[],
    double_materiality_assessment BOOLEAN DEFAULT false,
    assurance_level TEXT DEFAULT 'none',
    reporting_period_start DATE,
    reporting_period_end DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Science-Based Targets (SBTi)
CREATE TABLE IF NOT EXISTS public.science_based_targets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    target_type TEXT NOT NULL, -- 'absolute', 'intensity'
    scope TEXT NOT NULL, -- 'scope1', 'scope2', 'scope3', 'scope1_2'
    target_description TEXT NOT NULL,
    baseline_year INTEGER NOT NULL,
    baseline_emissions NUMERIC NOT NULL,
    target_year INTEGER NOT NULL,
    target_reduction_percentage NUMERIC NOT NULL,
    target_emissions NUMERIC,
    current_emissions NUMERIC,
    progress_percentage NUMERIC DEFAULT 0,
    methodology TEXT,
    temperature_alignment NUMERIC, -- e.g., 1.5, 2.0
    validation_status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'validated', 'rejected'
    sbti_commitment_date DATE,
    sbti_validation_date DATE,
    annual_reduction_rate NUMERIC,
    boundary_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SBT Progress Tracking
CREATE TABLE IF NOT EXISTS public.sbt_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    target_id UUID NOT NULL REFERENCES public.science_based_targets(id),
    reporting_year INTEGER NOT NULL,
    actual_emissions_scope1 NUMERIC DEFAULT 0,
    actual_emissions_scope2 NUMERIC DEFAULT 0,
    actual_emissions_scope3 NUMERIC,
    progress_percentage NUMERIC DEFAULT 0,
    on_track BOOLEAN DEFAULT true,
    explanatory_notes TEXT,
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TNFD Disclosures
CREATE TABLE IF NOT EXISTS public.tnfd_disclosures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    pillar TEXT NOT NULL, -- 'governance', 'strategy', 'risk_impact_management', 'metrics_targets'
    disclosure_id TEXT NOT NULL,
    disclosure_title TEXT NOT NULL,
    nature_related_topic TEXT NOT NULL,
    biomes_ecosystems TEXT[],
    leap_approach JSONB DEFAULT '{}', -- Locate, Evaluate, Assess, Prepare
    nature_dependencies JSONB DEFAULT '{}',
    nature_impacts JSONB DEFAULT '{}',
    nature_risks JSONB DEFAULT '{}',
    nature_opportunities JSONB DEFAULT '{}',
    quantitative_metrics JSONB DEFAULT '{}',
    scenario_analysis JSONB DEFAULT '{}',
    disclosure_content TEXT,
    reporting_period_start DATE,
    reporting_period_end DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PCAF Assessments
CREATE TABLE IF NOT EXISTS public.pcaf_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    assessment_name TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    portfolio_type TEXT NOT NULL, -- 'corporate_loans', 'mortgages', 'motor_vehicle_loans', 'investments', etc.
    total_financed_emissions NUMERIC DEFAULT 0,
    total_outstanding_amount NUMERIC DEFAULT 0,
    carbon_intensity NUMERIC DEFAULT 0,
    data_quality_score NUMERIC DEFAULT 0,
    coverage_percentage NUMERIC DEFAULT 0,
    methodology_version TEXT,
    sector_breakdown JSONB DEFAULT '{}',
    geography_breakdown JSONB DEFAULT '{}',
    asset_class_breakdown JSONB DEFAULT '{}',
    quality_flags JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financed Emissions Detail
CREATE TABLE IF NOT EXISTS public.financed_emissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    pcaf_assessment_id UUID REFERENCES public.pcaf_assessments(id),
    counterparty_name TEXT,
    counterparty_sector TEXT,
    counterparty_geography TEXT,
    asset_class TEXT NOT NULL,
    outstanding_amount NUMERIC NOT NULL,
    emissions_scope1 NUMERIC DEFAULT 0,
    emissions_scope2 NUMERIC DEFAULT 0,
    emissions_scope3 NUMERIC DEFAULT 0,
    total_emissions NUMERIC DEFAULT 0,
    data_quality_score INTEGER, -- 1-5 scale per PCAF
    attribution_factor NUMERIC,
    financed_emissions NUMERIC,
    methodology_used TEXT,
    data_sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Circular Economy Assessments
CREATE TABLE IF NOT EXISTS public.circular_economy_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    assessment_name TEXT NOT NULL,
    assessment_year INTEGER NOT NULL,
    circularity_rate NUMERIC DEFAULT 0, -- percentage
    material_input_total NUMERIC DEFAULT 0,
    material_circular_input NUMERIC DEFAULT 0,
    waste_generation_total NUMERIC DEFAULT 0,
    waste_circular_output NUMERIC DEFAULT 0,
    circular_strategies JSONB DEFAULT '{}',
    material_flows JSONB DEFAULT '{}',
    circular_indicators JSONB DEFAULT '{}',
    business_model_innovation JSONB DEFAULT '{}',
    value_retention_strategies TEXT[],
    assessment_methodology TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Material Flows for Circular Economy
CREATE TABLE IF NOT EXISTS public.material_flows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    assessment_id UUID REFERENCES public.circular_economy_assessments(id),
    material_category TEXT NOT NULL,
    flow_type TEXT NOT NULL, -- 'input', 'output', 'waste', 'recycled'
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    source_destination TEXT,
    circular_strategy TEXT, -- 'refuse', 'reduce', 'reuse', 'recycle', 'recover'
    circularity_potential NUMERIC DEFAULT 0,
    environmental_impact JSONB DEFAULT '{}',
    economic_value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Management Standards Implementation
CREATE TABLE IF NOT EXISTS public.management_standards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    standard_name TEXT NOT NULL, -- 'ISO 14001', 'ISO 45001', 'ISO 50001', etc.
    standard_version TEXT,
    implementation_status TEXT DEFAULT 'not_started',
    certification_status TEXT DEFAULT 'not_certified',
    certification_body TEXT,
    certificate_number TEXT,
    certification_date DATE,
    certificate_expiry_date DATE,
    scope_description TEXT,
    implementation_date DATE,
    last_audit_date DATE,
    next_audit_date DATE,
    audit_findings_count INTEGER DEFAULT 0,
    non_conformities_count INTEGER DEFAULT 0,
    improvement_opportunities_count INTEGER DEFAULT 0,
    maturity_level TEXT DEFAULT 'basic',
    responsible_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security Compliance Frameworks
CREATE TABLE IF NOT EXISTS public.security_frameworks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    framework_name TEXT NOT NULL, -- 'ISO 27001', 'SOC 2', 'GDPR', 'LGPD', etc.
    framework_version TEXT,
    implementation_status TEXT DEFAULT 'not_started',
    compliance_percentage NUMERIC DEFAULT 0,
    last_assessment_date DATE,
    next_assessment_date DATE,
    certification_status TEXT DEFAULT 'not_certified',
    certificate_expiry_date DATE,
    risk_rating TEXT DEFAULT 'medium',
    control_effectiveness NUMERIC DEFAULT 0,
    incident_count INTEGER DEFAULT 0,
    responsible_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Framework Requirements/Controls
CREATE TABLE IF NOT EXISTS public.framework_controls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    framework_id UUID REFERENCES public.security_frameworks(id),
    management_standard_id UUID REFERENCES public.management_standards(id),
    control_id TEXT NOT NULL,
    control_name TEXT NOT NULL,
    control_description TEXT,
    control_category TEXT,
    control_type TEXT, -- 'preventive', 'detective', 'corrective'
    implementation_status TEXT DEFAULT 'not_implemented',
    effectiveness_rating TEXT DEFAULT 'not_assessed',
    last_tested_date DATE,
    next_test_date DATE,
    responsible_user_id UUID,
    evidence_files TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ifrs_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sasb_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcfd_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esrs_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_based_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sbt_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tnfd_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcaf_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financed_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circular_economy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_controls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their company IFRS disclosures" ON public.ifrs_disclosures FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company SASB metrics" ON public.sasb_metrics FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company TCFD disclosures" ON public.tcfd_disclosures FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company ESRS disclosures" ON public.esrs_disclosures FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company science based targets" ON public.science_based_targets FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company SBT progress" ON public.sbt_progress FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company TNFD disclosures" ON public.tnfd_disclosures FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company PCAF assessments" ON public.pcaf_assessments FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company financed emissions" ON public.financed_emissions FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company circular economy assessments" ON public.circular_economy_assessments FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company material flows" ON public.material_flows FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company management standards" ON public.management_standards FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company security frameworks" ON public.security_frameworks FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Users can manage their company framework controls" ON public.framework_controls FOR ALL USING (company_id = get_user_company_id());

-- Create indexes for better performance
CREATE INDEX idx_ifrs_disclosures_company_id ON public.ifrs_disclosures(company_id);
CREATE INDEX idx_sasb_metrics_company_id ON public.sasb_metrics(company_id);
CREATE INDEX idx_tcfd_disclosures_company_id ON public.tcfd_disclosures(company_id);
CREATE INDEX idx_esrs_disclosures_company_id ON public.esrs_disclosures(company_id);
CREATE INDEX idx_science_based_targets_company_id ON public.science_based_targets(company_id);
CREATE INDEX idx_sbt_progress_company_id ON public.sbt_progress(company_id);
CREATE INDEX idx_tnfd_disclosures_company_id ON public.tnfd_disclosures(company_id);
CREATE INDEX idx_pcaf_assessments_company_id ON public.pcaf_assessments(company_id);
CREATE INDEX idx_financed_emissions_company_id ON public.financed_emissions(company_id);
CREATE INDEX idx_circular_economy_assessments_company_id ON public.circular_economy_assessments(company_id);
CREATE INDEX idx_material_flows_company_id ON public.material_flows(company_id);
CREATE INDEX idx_management_standards_company_id ON public.management_standards(company_id);
CREATE INDEX idx_security_frameworks_company_id ON public.security_frameworks(company_id);
CREATE INDEX idx_framework_controls_company_id ON public.framework_controls(company_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_ifrs_disclosures_updated_at BEFORE UPDATE ON public.ifrs_disclosures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sasb_metrics_updated_at BEFORE UPDATE ON public.sasb_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tcfd_disclosures_updated_at BEFORE UPDATE ON public.tcfd_disclosures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esrs_disclosures_updated_at BEFORE UPDATE ON public.esrs_disclosures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_science_based_targets_updated_at BEFORE UPDATE ON public.science_based_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tnfd_disclosures_updated_at BEFORE UPDATE ON public.tnfd_disclosures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pcaf_assessments_updated_at BEFORE UPDATE ON public.pcaf_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financed_emissions_updated_at BEFORE UPDATE ON public.financed_emissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circular_economy_assessments_updated_at BEFORE UPDATE ON public.circular_economy_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_flows_updated_at BEFORE UPDATE ON public.material_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_management_standards_updated_at BEFORE UPDATE ON public.management_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_frameworks_updated_at BEFORE UPDATE ON public.security_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_controls_updated_at BEFORE UPDATE ON public.framework_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();