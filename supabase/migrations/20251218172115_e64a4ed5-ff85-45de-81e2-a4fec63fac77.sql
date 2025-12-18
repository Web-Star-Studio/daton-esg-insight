-- =====================================================
-- FASE 1: Extensão do Modelo de Dados para Gestão de Indicadores
-- =====================================================

-- 1. Criar tabela de grupos de indicadores
CREATE TABLE IF NOT EXISTS public.indicator_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_group_id UUID REFERENCES public.indicator_groups(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar campos à tabela quality_indicators
ALTER TABLE public.quality_indicators 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS strategic_objective TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'higher_better' CHECK (direction IN ('higher_better', 'lower_better', 'equal_better')),
ADD COLUMN IF NOT EXISTS tolerance_value NUMERIC,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.indicator_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS analysis_user_id UUID,
ADD COLUMN IF NOT EXISTS auto_analysis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analysis_instructions TEXT,
ADD COLUMN IF NOT EXISTS suggested_actions TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'suspended'));

-- 3. Criar tabela de coletas (fontes de dados para cálculos)
CREATE TABLE IF NOT EXISTS public.indicator_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL,
  variable_name TEXT NOT NULL,
  description TEXT,
  measurement_unit TEXT,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  collection_type TEXT DEFAULT 'manual' CHECK (collection_type IN ('manual', 'automatic', 'calculated')),
  source_indicator_id UUID REFERENCES public.quality_indicators(id) ON DELETE SET NULL,
  formula TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar tabela de dados por período (JAN-DEZ)
CREATE TABLE IF NOT EXISTS public.indicator_period_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID NOT NULL REFERENCES public.quality_indicators(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.indicator_collections(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  measured_value NUMERIC,
  target_value NUMERIC,
  deviation_value NUMERIC,
  deviation_percentage NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('on_target', 'warning', 'critical', 'pending', 'not_applicable')),
  needs_action_plan BOOLEAN DEFAULT false,
  action_plan_id UUID,
  notes TEXT,
  collected_by_user_id UUID,
  collected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(indicator_id, collection_id, period_year, period_month)
);

-- 5. Adicionar campos à tabela indicator_targets
ALTER TABLE public.indicator_targets
ADD COLUMN IF NOT EXISTS tolerance_upper NUMERIC,
ADD COLUMN IF NOT EXISTS tolerance_lower NUMERIC,
ADD COLUMN IF NOT EXISTS target_by_period JSONB;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_indicator_groups_company ON public.indicator_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_indicator_groups_parent ON public.indicator_groups(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_quality_indicators_group ON public.quality_indicators(group_id);
CREATE INDEX IF NOT EXISTS idx_quality_indicators_code ON public.quality_indicators(code);
CREATE INDEX IF NOT EXISTS idx_indicator_collections_indicator ON public.indicator_collections(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_period_data_indicator ON public.indicator_period_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_period_data_period ON public.indicator_period_data(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_indicator_period_data_status ON public.indicator_period_data(status);

-- 7. Habilitar RLS nas novas tabelas
ALTER TABLE public.indicator_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_period_data ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para indicator_groups
CREATE POLICY "Users can view indicator groups from their company"
  ON public.indicator_groups FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create indicator groups in their company"
  ON public.indicator_groups FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update indicator groups in their company"
  ON public.indicator_groups FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete indicator groups in their company"
  ON public.indicator_groups FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 9. Políticas RLS para indicator_collections
CREATE POLICY "Users can view indicator collections from their company"
  ON public.indicator_collections FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create indicator collections in their company"
  ON public.indicator_collections FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update indicator collections in their company"
  ON public.indicator_collections FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete indicator collections in their company"
  ON public.indicator_collections FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 10. Políticas RLS para indicator_period_data
CREATE POLICY "Users can view indicator period data from their company"
  ON public.indicator_period_data FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create indicator period data in their company"
  ON public.indicator_period_data FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update indicator period data in their company"
  ON public.indicator_period_data FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete indicator period data in their company"
  ON public.indicator_period_data FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 11. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_indicator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_indicator_groups_updated_at ON public.indicator_groups;
CREATE TRIGGER trigger_indicator_groups_updated_at
  BEFORE UPDATE ON public.indicator_groups
  FOR EACH ROW EXECUTE FUNCTION update_indicator_updated_at();

DROP TRIGGER IF EXISTS trigger_indicator_collections_updated_at ON public.indicator_collections;
CREATE TRIGGER trigger_indicator_collections_updated_at
  BEFORE UPDATE ON public.indicator_collections
  FOR EACH ROW EXECUTE FUNCTION update_indicator_updated_at();

DROP TRIGGER IF EXISTS trigger_indicator_period_data_updated_at ON public.indicator_period_data;
CREATE TRIGGER trigger_indicator_period_data_updated_at
  BEFORE UPDATE ON public.indicator_period_data
  FOR EACH ROW EXECUTE FUNCTION update_indicator_updated_at();