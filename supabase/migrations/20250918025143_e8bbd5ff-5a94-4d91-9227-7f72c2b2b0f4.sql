-- FASE 1: MÓDULO SOCIAL COMPLETO

-- Tabela de funcionários
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    birth_date DATE,
    gender VARCHAR(20),
    ethnicity VARCHAR(50),
    education_level VARCHAR(50),
    salary NUMERIC,
    employment_type VARCHAR(50) DEFAULT 'CLT',
    status VARCHAR(20) DEFAULT 'Ativo',
    manager_id UUID,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saúde e Segurança - Registro de acidentes
CREATE TABLE public.safety_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_id UUID,
    incident_date DATE NOT NULL,
    incident_time TIME,
    location VARCHAR(255),
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    immediate_cause TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    days_lost INTEGER DEFAULT 0,
    medical_treatment_required BOOLEAN DEFAULT false,
    reported_by_user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'Investigando',
    investigation_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Treinamentos
CREATE TABLE public.training_programs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_hours NUMERIC,
    is_mandatory BOOLEAN DEFAULT false,
    valid_for_months INTEGER,
    created_by_user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registro de treinamentos dos funcionários
CREATE TABLE public.employee_trainings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    training_program_id UUID NOT NULL,
    completion_date DATE,
    expiration_date DATE,
    score NUMERIC,
    status VARCHAR(50) DEFAULT 'Em andamento',
    trainer VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projetos sociais
CREATE TABLE public.social_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objective TEXT,
    target_audience VARCHAR(255),
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    budget NUMERIC,
    invested_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Planejado',
    impact_metrics JSONB DEFAULT '{}',
    responsible_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FASE 2: MÓDULO DE GOVERNANÇA

-- Membros do conselho e comitês
CREATE TABLE public.board_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    committee VARCHAR(100),
    appointment_date DATE NOT NULL,
    term_end_date DATE,
    is_independent BOOLEAN DEFAULT false,
    gender VARCHAR(20),
    age INTEGER,
    experience_years INTEGER,
    expertise_areas TEXT[],
    biography TEXT,
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Políticas corporativas
CREATE TABLE public.corporate_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    content TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE NOT NULL,
    review_date DATE,
    approval_date DATE,
    approved_by_user_id UUID,
    status VARCHAR(50) DEFAULT 'Rascunho',
    file_path VARCHAR(500),
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sistema de denúncias
CREATE TABLE public.whistleblower_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    report_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE,
    location VARCHAR(255),
    people_involved TEXT,
    evidence_description TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    reporter_name VARCHAR(255),
    reporter_email VARCHAR(255),
    reporter_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Recebida',
    priority VARCHAR(20) DEFAULT 'Média',
    assigned_to_user_id UUID,
    investigation_notes TEXT,
    resolution_summary TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Riscos ESG
CREATE TABLE public.esg_risks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    risk_title VARCHAR(255) NOT NULL,
    risk_description TEXT NOT NULL,
    esg_category VARCHAR(20) NOT NULL, -- Environmental, Social, Governance
    risk_category VARCHAR(100),
    probability VARCHAR(20) NOT NULL, -- Baixa, Média, Alta
    impact VARCHAR(20) NOT NULL, -- Baixo, Médio, Alto
    inherent_risk_level VARCHAR(20), -- Calculado automaticamente
    mitigation_actions TEXT,
    control_measures TEXT,
    residual_risk_level VARCHAR(20),
    owner_user_id UUID,
    review_frequency VARCHAR(50),
    last_review_date DATE,
    next_review_date DATE,
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indicadores de performance ESG
CREATE TABLE public.esg_performance_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    indicator_code VARCHAR(50) NOT NULL,
    indicator_name VARCHAR(255) NOT NULL,
    esg_category VARCHAR(20) NOT NULL,
    measurement_unit VARCHAR(50),
    target_value NUMERIC,
    current_value NUMERIC,
    reporting_period DATE NOT NULL,
    data_source VARCHAR(255),
    calculation_method TEXT,
    is_kpi BOOLEAN DEFAULT false,
    benchmark_value NUMERIC,
    trend VARCHAR(20), -- Melhorando, Estável, Piorando
    responsible_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relatórios ESG integrados
CREATE TABLE public.integrated_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    report_title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- Anual, Semestral, Trimestral
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    framework VARCHAR(100), -- GRI, SASB, TCFD, IR
    content JSONB DEFAULT '{}',
    environmental_score NUMERIC,
    social_score NUMERIC,
    governance_score NUMERIC,
    overall_esg_score NUMERIC,
    status VARCHAR(50) DEFAULT 'Rascunho',
    published_at TIMESTAMP WITH TIME ZONE,
    file_path VARCHAR(500),
    created_by_user_id UUID NOT NULL,
    approved_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurar RLS para todas as tabelas
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whistleblower_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_performance_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrated_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para employees
CREATE POLICY "Users can manage their company employees" 
ON public.employees 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para safety_incidents
CREATE POLICY "Users can manage their company safety incidents" 
ON public.safety_incidents 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para training_programs
CREATE POLICY "Users can manage their company training programs" 
ON public.training_programs 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para employee_trainings
CREATE POLICY "Users can manage their company employee trainings" 
ON public.employee_trainings 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para social_projects
CREATE POLICY "Users can manage their company social projects" 
ON public.social_projects 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para board_members
CREATE POLICY "Users can manage their company board members" 
ON public.board_members 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para corporate_policies
CREATE POLICY "Users can manage their company corporate policies" 
ON public.corporate_policies 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para whistleblower_reports
CREATE POLICY "Users can manage their company whistleblower reports" 
ON public.whistleblower_reports 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para esg_risks
CREATE POLICY "Users can manage their company ESG risks" 
ON public.esg_risks 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para esg_performance_indicators
CREATE POLICY "Users can manage their company ESG performance indicators" 
ON public.esg_performance_indicators 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para integrated_reports
CREATE POLICY "Users can manage their company integrated reports" 
ON public.integrated_reports 
FOR ALL 
USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON public.training_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_trainings_updated_at BEFORE UPDATE ON public.employee_trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_projects_updated_at BEFORE UPDATE ON public.social_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_board_members_updated_at BEFORE UPDATE ON public.board_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corporate_policies_updated_at BEFORE UPDATE ON public.corporate_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whistleblower_reports_updated_at BEFORE UPDATE ON public.whistleblower_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_esg_risks_updated_at BEFORE UPDATE ON public.esg_risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_esg_performance_indicators_updated_at BEFORE UPDATE ON public.esg_performance_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrated_reports_updated_at BEFORE UPDATE ON public.integrated_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular nível de risco
CREATE OR REPLACE FUNCTION public.calculate_risk_level(p_probability VARCHAR, p_impact VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Matriz de risco: Probabilidade x Impacto
    CASE 
        WHEN p_probability = 'Alta' AND p_impact = 'Alto' THEN RETURN 'Crítico';
        WHEN (p_probability = 'Alta' AND p_impact = 'Médio') OR (p_probability = 'Média' AND p_impact = 'Alto') THEN RETURN 'Alto';
        WHEN (p_probability = 'Alta' AND p_impact = 'Baixo') OR (p_probability = 'Média' AND p_impact = 'Médio') OR (p_probability = 'Baixa' AND p_impact = 'Alto') THEN RETURN 'Médio';
        WHEN (p_probability = 'Média' AND p_impact = 'Baixo') OR (p_probability = 'Baixa' AND p_impact = 'Médio') THEN RETURN 'Baixo';
        WHEN p_probability = 'Baixa' AND p_impact = 'Baixo' THEN RETURN 'Muito Baixo';
        ELSE RETURN 'Indefinido';
    END CASE;
END;
$$;

-- Trigger para calcular nível de risco automaticamente
CREATE OR REPLACE FUNCTION public.update_risk_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.inherent_risk_level = calculate_risk_level(NEW.probability, NEW.impact);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_risk_level_trigger
    BEFORE INSERT OR UPDATE ON public.esg_risks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_risk_level();