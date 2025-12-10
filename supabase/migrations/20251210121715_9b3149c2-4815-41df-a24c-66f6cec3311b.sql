-- Tabela para perfis de compliance das unidades
CREATE TABLE IF NOT EXISTS public.legislation_compliance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Setores de atividade da unidade
  activity_sectors JSONB DEFAULT '[]'::jsonb,
  
  -- Características específicas
  has_fleet BOOLEAN DEFAULT false,
  has_hazardous_materials BOOLEAN DEFAULT false,
  has_environmental_license BOOLEAN DEFAULT false,
  has_wastewater_treatment BOOLEAN DEFAULT false,
  has_air_emissions BOOLEAN DEFAULT false,
  has_solid_waste BOOLEAN DEFAULT false,
  
  -- Atividades realizadas
  activities JSONB DEFAULT '[]'::jsonb,
  
  -- Tipos de resíduos gerados
  waste_types JSONB DEFAULT '[]'::jsonb,
  
  -- Escopo geográfico
  operating_states TEXT[] DEFAULT '{}',
  operating_municipalities TEXT[] DEFAULT '{}',
  
  -- Faixa de funcionários
  employee_count_range TEXT,
  
  -- Certificações da unidade
  certifications TEXT[] DEFAULT '{}',
  
  -- Outros campos relevantes
  industry_type TEXT,
  risk_level TEXT,
  notes TEXT,
  
  -- Campos de controle
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint única por branch
  CONSTRAINT unique_branch_compliance_profile UNIQUE (branch_id)
);

-- Adicionar campo de tags de aplicabilidade nas legislações
ALTER TABLE public.legislations 
ADD COLUMN IF NOT EXISTS applicability_tags JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.legislations.applicability_tags IS 'Tags para filtro inteligente de aplicabilidade. Ex: ["frota", "residuos_perigosos", "licenciamento_ambiental"]';

-- Habilitar RLS
ALTER TABLE public.legislation_compliance_profiles ENABLE ROW LEVEL SECURITY;

-- Policies para legislation_compliance_profiles
CREATE POLICY "Users can view compliance profiles from their company"
ON public.legislation_compliance_profiles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert compliance profiles for their company"
ON public.legislation_compliance_profiles
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update compliance profiles from their company"
ON public.legislation_compliance_profiles
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete compliance profiles from their company"
ON public.legislation_compliance_profiles
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_legislation_compliance_profiles_updated_at
  BEFORE UPDATE ON public.legislation_compliance_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_legislation_compliance_profiles_company_id 
ON public.legislation_compliance_profiles(company_id);

CREATE INDEX IF NOT EXISTS idx_legislation_compliance_profiles_branch_id 
ON public.legislation_compliance_profiles(branch_id);

CREATE INDEX IF NOT EXISTS idx_legislations_applicability_tags 
ON public.legislations USING GIN (applicability_tags);