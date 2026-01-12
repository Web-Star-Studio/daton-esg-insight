-- Tabela de Setores para LAIA
CREATE TABLE public.laia_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Tabela de Avaliações LAIA
CREATE TABLE public.laia_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  
  -- IDENTIFICAÇÃO
  sector_id UUID REFERENCES public.laia_sectors(id) ON DELETE SET NULL,
  aspect_code VARCHAR(20) NOT NULL,
  activity_operation TEXT NOT NULL,
  environmental_aspect TEXT NOT NULL,
  environmental_impact TEXT NOT NULL,
  
  -- CARACTERIZAÇÃO
  temporality VARCHAR(10) NOT NULL CHECK (temporality IN ('passada', 'atual', 'futura')),
  operational_situation VARCHAR(15) NOT NULL CHECK (operational_situation IN ('normal', 'anormal', 'emergencia')),
  incidence VARCHAR(15) NOT NULL CHECK (incidence IN ('direto', 'indireto')),
  impact_class VARCHAR(10) NOT NULL CHECK (impact_class IN ('benefico', 'adverso')),
  
  -- VERIFICAÇÃO DE IMPORTÂNCIA
  scope VARCHAR(10) NOT NULL CHECK (scope IN ('local', 'regional', 'global')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('baixa', 'media', 'alta')),
  consequence_score INTEGER NOT NULL,
  frequency_probability VARCHAR(10) NOT NULL CHECK (frequency_probability IN ('baixa', 'media', 'alta')),
  freq_prob_score INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  category VARCHAR(15) NOT NULL CHECK (category IN ('desprezivel', 'moderado', 'critico')),
  
  -- AVALIAÇÃO DE SIGNIFICÂNCIA
  has_legal_requirements BOOLEAN DEFAULT false,
  has_stakeholder_demand BOOLEAN DEFAULT false,
  has_strategic_options BOOLEAN DEFAULT false,
  significance VARCHAR(20) NOT NULL CHECK (significance IN ('significativo', 'nao_significativo')),
  
  -- OBSERVAÇÕES ADICIONAIS
  control_types TEXT[],
  existing_controls TEXT,
  legislation_reference TEXT,
  
  -- PERSPECTIVA DO CICLO DE VIDA
  has_lifecycle_control BOOLEAN DEFAULT false,
  lifecycle_stages TEXT[],
  output_actions TEXT,
  
  -- METADATA
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_revisao')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_laia_sectors_company ON public.laia_sectors(company_id);
CREATE INDEX idx_laia_assessments_company ON public.laia_assessments(company_id);
CREATE INDEX idx_laia_assessments_sector ON public.laia_assessments(sector_id);
CREATE INDEX idx_laia_assessments_category ON public.laia_assessments(category);
CREATE INDEX idx_laia_assessments_significance ON public.laia_assessments(significance);
CREATE INDEX idx_laia_assessments_status ON public.laia_assessments(status);

-- Habilitar RLS
ALTER TABLE public.laia_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laia_assessments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para laia_sectors
CREATE POLICY "Users can view sectors from their company"
ON public.laia_sectors FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert sectors in their company"
ON public.laia_sectors FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update sectors in their company"
ON public.laia_sectors FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete sectors in their company"
ON public.laia_sectors FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Políticas RLS para laia_assessments
CREATE POLICY "Users can view assessments from their company"
ON public.laia_assessments FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert assessments in their company"
ON public.laia_assessments FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update assessments in their company"
ON public.laia_assessments FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete assessments in their company"
ON public.laia_assessments FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_laia_sectors_updated_at
BEFORE UPDATE ON public.laia_sectors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laia_assessments_updated_at
BEFORE UPDATE ON public.laia_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();