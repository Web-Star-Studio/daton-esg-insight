-- Create ENUMs
CREATE TYPE public.user_role_enum AS ENUM ('Admin', 'Editor', 'Leitor');
CREATE TYPE public.emission_factor_type_enum AS ENUM ('system', 'custom');
CREATE TYPE public.emission_source_status_enum AS ENUM ('Ativo', 'Inativo');

-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    role public.user_role_enum NOT NULL DEFAULT 'Leitor',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emission_factors table
CREATE TABLE public.emission_factors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    source VARCHAR(255) NOT NULL,
    year_of_validity INTEGER,
    type public.emission_factor_type_enum NOT NULL DEFAULT 'system',
    co2_factor DECIMAL(15,6),
    ch4_factor DECIMAL(15,6),
    n2o_factor DECIMAL(15,6),
    activity_unit VARCHAR(50) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT check_system_factors_no_company CHECK (
        (type = 'system' AND company_id IS NULL) OR 
        (type = 'custom' AND company_id IS NOT NULL)
    ),
    CONSTRAINT check_at_least_one_factor CHECK (
        co2_factor IS NOT NULL OR ch4_factor IS NOT NULL OR n2o_factor IS NOT NULL
    )
);

-- Create emission_sources table
CREATE TABLE public.emission_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    status public.emission_source_status_enum NOT NULL DEFAULT 'Ativo',
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_data table
CREATE TABLE public.activity_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    source_document VARCHAR(255),
    emission_source_id UUID NOT NULL REFERENCES public.emission_sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT check_valid_period CHECK (period_end_date >= period_start_date)
);

-- Create calculated_emissions table
CREATE TABLE public.calculated_emissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    total_co2e DECIMAL(15,6) NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    details_json JSONB,
    activity_data_id UUID NOT NULL REFERENCES public.activity_data(id) ON DELETE CASCADE UNIQUE,
    emission_factor_id UUID NOT NULL REFERENCES public.emission_factors(id) ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_emission_factors_company_type ON public.emission_factors(company_id, type);
CREATE INDEX idx_emission_sources_company_scope ON public.emission_sources(company_id, scope);
CREATE INDEX idx_activity_data_emission_source ON public.activity_data(emission_source_id);
CREATE INDEX idx_activity_data_period ON public.activity_data(period_start_date, period_end_date);
CREATE INDEX idx_calculated_emissions_activity_data ON public.calculated_emissions(activity_data_id);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculated_emissions ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (id = public.get_user_company_id());

CREATE POLICY "Users can update their own company" ON public.companies
    FOR UPDATE USING (id = public.get_user_company_id());

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles from their company" ON public.profiles
    FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid() AND company_id = public.get_user_company_id());

-- RLS Policies for emission_factors
CREATE POLICY "Users can view system emission factors" ON public.emission_factors
    FOR SELECT USING (type = 'system' OR company_id = public.get_user_company_id());

CREATE POLICY "Users can insert custom emission factors" ON public.emission_factors
    FOR INSERT WITH CHECK (type = 'custom' AND company_id = public.get_user_company_id());

CREATE POLICY "Users can update their custom emission factors" ON public.emission_factors
    FOR UPDATE USING (type = 'custom' AND company_id = public.get_user_company_id());

CREATE POLICY "Users can delete their custom emission factors" ON public.emission_factors
    FOR DELETE USING (type = 'custom' AND company_id = public.get_user_company_id());

-- RLS Policies for emission_sources
CREATE POLICY "Users can manage their company emission sources" ON public.emission_sources
    FOR ALL USING (company_id = public.get_user_company_id());

-- RLS Policies for activity_data
CREATE POLICY "Users can manage activity data from their company" ON public.activity_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.emission_sources 
            WHERE id = activity_data.emission_source_id 
            AND company_id = public.get_user_company_id()
        )
    );

-- RLS Policies for calculated_emissions
CREATE POLICY "Users can view calculated emissions from their company" ON public.calculated_emissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.activity_data ad
            JOIN public.emission_sources es ON ad.emission_source_id = es.id
            WHERE ad.id = calculated_emissions.activity_data_id
            AND es.company_id = public.get_user_company_id()
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for emission_sources updated_at
CREATE TRIGGER update_emission_sources_updated_at
    BEFORE UPDATE ON public.emission_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be called when a user signs up, but profile creation
    -- should be handled manually in the app after company selection
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert system emission factors (sample data)
INSERT INTO public.emission_factors (name, category, source, year_of_validity, type, co2_factor, ch4_factor, n2o_factor, activity_unit) VALUES
    ('Diesel S10', 'Combustão Estacionária', 'MCTI 2025', 2025, 'system', 2.54, 0.0001, 0.000005, 'Litro'),
    ('Gasolina Comum', 'Combustão Estacionária', 'MCTI 2025', 2025, 'system', 2.27, 0.000095, 0.000004, 'Litro'),
    ('Gás Natural', 'Combustão Estacionária', 'MCTI 2025', 2025, 'system', 1.95, 0.000037, 0.000004, 'm³'),
    ('Energia Elétrica - SIN', 'Eletricidade Adquirida', 'MCTI 2025', 2025, 'system', 0.0817, NULL, NULL, 'kWh'),
    ('Diesel S500', 'Fontes Móveis', 'MCTI 2025', 2025, 'system', 2.67, 0.000085, 0.000006, 'Litro'),
    ('Etanol Hidratado', 'Fontes Móveis', 'MCTI 2025', 2025, 'system', 1.22, 0.000012, 0.000002, 'Litro'),
    ('GLP - Gás Liquefeito', 'Combustão Estacionária', 'MCTI 2025', 2025, 'system', 2.99, 0.000005, 0.000003, 'kg');