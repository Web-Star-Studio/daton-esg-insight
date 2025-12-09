-- =============================================
-- MÓDULO DE LEGISLAÇÕES - NOVAS TABELAS
-- =============================================

-- Macrotemas de Legislação (Ex: Meio Ambiente, RH, Qualidade, Segurança)
CREATE TABLE public.legislation_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subtemas de Legislação (Ex: Licenciamento, Recursos Hídricos, Resíduos)
CREATE TABLE public.legislation_subthemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES public.legislation_themes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legislações principais
CREATE TABLE public.legislations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Classificação
  theme_id UUID REFERENCES public.legislation_themes(id) ON DELETE SET NULL,
  subtheme_id UUID REFERENCES public.legislation_subthemes(id) ON DELETE SET NULL,
  
  -- Identificação da Norma
  norm_type VARCHAR(50) NOT NULL, -- Lei, Decreto, Portaria, Resolução, IN, NBR, etc.
  issuing_body VARCHAR(100), -- IBAMA, CONTRAN, MTE, INMETRO, etc.
  norm_number VARCHAR(50),
  publication_date DATE,
  
  -- Conteúdo
  title TEXT NOT NULL,
  summary TEXT, -- Ementa/Premissa
  full_text_url TEXT,
  
  -- Escopo Geográfico
  jurisdiction VARCHAR(20) NOT NULL DEFAULT 'federal', -- 'federal', 'estadual', 'municipal', 'nbr', 'internacional'
  state VARCHAR(2), -- Para estaduais
  municipality VARCHAR(100), -- Para municipais
  
  -- Status Geral
  overall_applicability VARCHAR(20) DEFAULT 'pending', -- 'real', 'potential', 'revoked', 'na', 'pending'
  overall_status VARCHAR(30) DEFAULT 'pending', -- 'conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'pending'
  has_alert BOOLEAN DEFAULT false, -- TRUE quando status requer atenção
  
  -- Responsabilidade
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Relacionamentos
  revokes_legislation_id UUID REFERENCES public.legislations(id) ON DELETE SET NULL,
  revoked_by_legislation_id UUID REFERENCES public.legislations(id) ON DELETE SET NULL,
  related_legislation_ids UUID[],
  
  -- Controle de Revisão
  last_review_date DATE,
  next_review_date DATE,
  review_frequency_days INTEGER DEFAULT 365,
  observations TEXT,
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Avaliação por unidade (branch)
CREATE TABLE public.legislation_unit_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Aplicabilidade: 'real', 'potential', 'na', 'revoked', 'pending'
  applicability VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Status de Atendimento: 'conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'pending'
  compliance_status VARCHAR(30) DEFAULT 'pending',
  
  -- Pendências
  has_pending_requirements BOOLEAN DEFAULT false,
  pending_description TEXT,
  action_plan TEXT,
  action_plan_deadline DATE,
  
  -- Evidências
  evidence_notes TEXT,
  
  -- Responsável específico da unidade
  unit_responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Datas
  evaluated_at TIMESTAMPTZ,
  evaluated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(legislation_id, branch_id)
);

-- Evidências de legislação
CREATE TABLE public.legislation_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  unit_compliance_id UUID REFERENCES public.legislation_unit_compliance(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_type VARCHAR(50) DEFAULT 'documento', -- 'documento', 'laudo', 'procedimento', 'controle', 'anexo'
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de alterações
CREATE TABLE public.legislation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_id UUID NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'revoked', 'reviewed'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Vínculo licenças ↔ legislações
CREATE TABLE public.license_legislation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  legislation_id UUID NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  link_type VARCHAR(30) DEFAULT 'references', -- 'requires', 'references', 'derived_from'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(license_id, legislation_id)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_legislation_themes_company ON public.legislation_themes(company_id);
CREATE INDEX idx_legislation_subthemes_theme ON public.legislation_subthemes(theme_id);
CREATE INDEX idx_legislation_subthemes_company ON public.legislation_subthemes(company_id);
CREATE INDEX idx_legislations_company ON public.legislations(company_id);
CREATE INDEX idx_legislations_theme ON public.legislations(theme_id);
CREATE INDEX idx_legislations_jurisdiction ON public.legislations(jurisdiction);
CREATE INDEX idx_legislations_status ON public.legislations(overall_status);
CREATE INDEX idx_legislations_applicability ON public.legislations(overall_applicability);
CREATE INDEX idx_legislation_unit_compliance_legislation ON public.legislation_unit_compliance(legislation_id);
CREATE INDEX idx_legislation_unit_compliance_branch ON public.legislation_unit_compliance(branch_id);
CREATE INDEX idx_legislation_evidences_legislation ON public.legislation_evidences(legislation_id);
CREATE INDEX idx_legislation_history_legislation ON public.legislation_history(legislation_id);
CREATE INDEX idx_license_legislation_links_license ON public.license_legislation_links(license_id);
CREATE INDEX idx_license_legislation_links_legislation ON public.license_legislation_links(legislation_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.legislation_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_subthemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_unit_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_legislation_links ENABLE ROW LEVEL SECURITY;

-- Policies for legislation_themes
CREATE POLICY "Users can view themes of their company" ON public.legislation_themes
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage themes of their company" ON public.legislation_themes
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for legislation_subthemes
CREATE POLICY "Users can view subthemes of their company" ON public.legislation_subthemes
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage subthemes of their company" ON public.legislation_subthemes
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for legislations
CREATE POLICY "Users can view legislations of their company" ON public.legislations
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage legislations of their company" ON public.legislations
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for legislation_unit_compliance
CREATE POLICY "Users can view unit compliance of their company" ON public.legislation_unit_compliance
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage unit compliance of their company" ON public.legislation_unit_compliance
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for legislation_evidences
CREATE POLICY "Users can view evidences of their company" ON public.legislation_evidences
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage evidences of their company" ON public.legislation_evidences
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for legislation_history
CREATE POLICY "Users can view history of their company" ON public.legislation_history
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert history of their company" ON public.legislation_history
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for license_legislation_links
CREATE POLICY "Users can view links of their company" ON public.license_legislation_links
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage links of their company" ON public.license_legislation_links
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_legislation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_legislation_themes_updated_at
  BEFORE UPDATE ON public.legislation_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_legislation_updated_at();

CREATE TRIGGER update_legislation_subthemes_updated_at
  BEFORE UPDATE ON public.legislation_subthemes
  FOR EACH ROW EXECUTE FUNCTION public.update_legislation_updated_at();

CREATE TRIGGER update_legislations_updated_at
  BEFORE UPDATE ON public.legislations
  FOR EACH ROW EXECUTE FUNCTION public.update_legislation_updated_at();

CREATE TRIGGER update_legislation_unit_compliance_updated_at
  BEFORE UPDATE ON public.legislation_unit_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_legislation_updated_at();

-- Trigger para criar histórico automaticamente
CREATE OR REPLACE FUNCTION public.create_legislation_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.legislation_history (legislation_id, company_id, action, new_values, changed_by)
    VALUES (NEW.id, NEW.company_id, 'created', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.legislation_history (legislation_id, company_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, NEW.company_id, 
      CASE 
        WHEN OLD.overall_status != NEW.overall_status THEN 'status_changed'
        WHEN OLD.is_active = true AND NEW.is_active = false THEN 'revoked'
        ELSE 'updated'
      END,
      to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER legislation_history_trigger
  AFTER INSERT OR UPDATE ON public.legislations
  FOR EACH ROW EXECUTE FUNCTION public.create_legislation_history();

-- =============================================
-- DADOS INICIAIS (Macrotemas padrão)
-- =============================================
-- Nota: Estes serão inseridos pela aplicação quando a empresa for criada