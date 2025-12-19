
-- =====================================================
-- MÓDULO DE GESTÃO DE NÃO CONFORMIDADES - FASE 1
-- Baseado no modelo Qualyteam (6 etapas)
-- =====================================================

-- 1. Atualizar tabela non_conformities com campos de etapas
ALTER TABLE public.non_conformities 
ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stage_1_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_2_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_3_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_4_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_5_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_6_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_nc_id UUID REFERENCES public.non_conformities(id),
ADD COLUMN IF NOT EXISTS organizational_unit_id UUID,
ADD COLUMN IF NOT EXISTS process_id UUID;

-- Comentários explicativos
COMMENT ON COLUMN public.non_conformities.current_stage IS 'Etapa atual: 1-Registro, 2-Ação Imediata, 3-Análise Causa, 4-Planejamento, 5-Implementação, 6-Eficácia';
COMMENT ON COLUMN public.non_conformities.revision_number IS 'Número da revisão quando NC é reaberta por ineficácia';
COMMENT ON COLUMN public.non_conformities.parent_nc_id IS 'ID da NC original quando esta é uma revisão';

-- =====================================================
-- 2. Tabela nc_immediate_actions (Ações Imediatas - Etapa 2)
-- =====================================================
CREATE TABLE public.nc_immediate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  responsible_user_id UUID REFERENCES public.profiles(id),
  due_date DATE NOT NULL,
  completion_date DATE,
  evidence TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Cancelada')),
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_nc_immediate_actions_nc_id ON public.nc_immediate_actions(non_conformity_id);
CREATE INDEX idx_nc_immediate_actions_company ON public.nc_immediate_actions(company_id);
CREATE INDEX idx_nc_immediate_actions_responsible ON public.nc_immediate_actions(responsible_user_id);
CREATE INDEX idx_nc_immediate_actions_status ON public.nc_immediate_actions(status);

-- RLS
ALTER TABLE public.nc_immediate_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_immediate_actions_select" ON public.nc_immediate_actions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_immediate_actions_insert" ON public.nc_immediate_actions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_immediate_actions_update" ON public.nc_immediate_actions
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_immediate_actions_delete" ON public.nc_immediate_actions
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER update_nc_immediate_actions_updated_at
  BEFORE UPDATE ON public.nc_immediate_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. Tabela nc_cause_analysis (Análise de Causa - Etapa 3)
-- =====================================================
CREATE TABLE public.nc_cause_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_method TEXT NOT NULL CHECK (analysis_method IN ('root_cause', 'ishikawa', '5_whys', 'other')),
  root_cause TEXT,
  similar_nc_ids JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Dados do Diagrama de Ishikawa (6M)
  ishikawa_data JSONB DEFAULT '{
    "metodo": [],
    "material": [],
    "medida": [],
    "maquina": [],
    "mao_obra": [],
    "meio_ambiente": []
  }'::jsonb,
  -- Dados dos 5 Porquês
  five_whys_data JSONB DEFAULT '[]'::jsonb,
  responsible_user_id UUID REFERENCES public.profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_nc_cause_analysis_nc_id ON public.nc_cause_analysis(non_conformity_id);
CREATE INDEX idx_nc_cause_analysis_company ON public.nc_cause_analysis(company_id);
CREATE INDEX idx_nc_cause_analysis_method ON public.nc_cause_analysis(analysis_method);

-- RLS
ALTER TABLE public.nc_cause_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_cause_analysis_select" ON public.nc_cause_analysis
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_cause_analysis_insert" ON public.nc_cause_analysis
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_cause_analysis_update" ON public.nc_cause_analysis
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_cause_analysis_delete" ON public.nc_cause_analysis
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER update_nc_cause_analysis_updated_at
  BEFORE UPDATE ON public.nc_cause_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. Tabela nc_action_plans (Plano de Ação 5W2H - Etapa 4)
-- =====================================================
CREATE TABLE public.nc_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- 5W2H
  what_action TEXT NOT NULL,
  why_reason TEXT,
  how_method TEXT,
  where_location TEXT,
  who_responsible_id UUID REFERENCES public.profiles(id),
  when_deadline DATE NOT NULL,
  how_much_cost TEXT,
  -- Status e conclusão
  status TEXT DEFAULT 'Planejada' CHECK (status IN ('Planejada', 'Em Execução', 'Concluída', 'Cancelada')),
  evidence TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  completion_date DATE,
  completed_at TIMESTAMPTZ,
  -- Metadados
  order_index INTEGER DEFAULT 0,
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_nc_action_plans_nc_id ON public.nc_action_plans(non_conformity_id);
CREATE INDEX idx_nc_action_plans_company ON public.nc_action_plans(company_id);
CREATE INDEX idx_nc_action_plans_responsible ON public.nc_action_plans(who_responsible_id);
CREATE INDEX idx_nc_action_plans_status ON public.nc_action_plans(status);
CREATE INDEX idx_nc_action_plans_deadline ON public.nc_action_plans(when_deadline);

-- RLS
ALTER TABLE public.nc_action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_action_plans_select" ON public.nc_action_plans
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_action_plans_insert" ON public.nc_action_plans
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_action_plans_update" ON public.nc_action_plans
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_action_plans_delete" ON public.nc_action_plans
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER update_nc_action_plans_updated_at
  BEFORE UPDATE ON public.nc_action_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. Tabela nc_effectiveness (Avaliação de Eficácia - Etapa 6)
-- =====================================================
CREATE TABLE public.nc_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Avaliação
  is_effective BOOLEAN,
  evidence TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Impactos identificados
  requires_risk_update BOOLEAN DEFAULT false,
  risk_update_notes TEXT,
  requires_sgq_change BOOLEAN DEFAULT false,
  sgq_change_notes TEXT,
  -- Responsável pela avaliação
  evaluated_by_user_id UUID REFERENCES public.profiles(id),
  evaluated_at TIMESTAMPTZ,
  -- Postergação (quando não é possível avaliar ainda)
  postponed_to DATE,
  postponed_reason TEXT,
  postponed_responsible_id UUID REFERENCES public.profiles(id),
  -- Revisão (quando ineficaz, gera nova revisão da NC)
  revision_number INTEGER DEFAULT 1,
  generated_revision_nc_id UUID REFERENCES public.non_conformities(id),
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_nc_effectiveness_nc_id ON public.nc_effectiveness(non_conformity_id);
CREATE INDEX idx_nc_effectiveness_company ON public.nc_effectiveness(company_id);
CREATE INDEX idx_nc_effectiveness_effective ON public.nc_effectiveness(is_effective);

-- RLS
ALTER TABLE public.nc_effectiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_effectiveness_select" ON public.nc_effectiveness
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_effectiveness_insert" ON public.nc_effectiveness
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_effectiveness_update" ON public.nc_effectiveness
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_effectiveness_delete" ON public.nc_effectiveness
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER update_nc_effectiveness_updated_at
  BEFORE UPDATE ON public.nc_effectiveness
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. Tabela nc_tasks (Tarefas Consolidadas)
-- =====================================================
CREATE TABLE public.nc_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Tipo e referência
  task_type TEXT NOT NULL CHECK (task_type IN (
    'registration', 'immediate_action', 'cause_analysis', 
    'planning', 'implementation', 'effectiveness'
  )),
  reference_id UUID,
  reference_table TEXT,
  -- Detalhes da tarefa
  title TEXT NOT NULL,
  description TEXT,
  responsible_user_id UUID REFERENCES public.profiles(id),
  due_date DATE NOT NULL,
  -- Status
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Atrasada', 'Cancelada')),
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Baixa', 'Normal', 'Alta', 'Urgente')),
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES public.profiles(id),
  -- Metadados
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_nc_tasks_nc_id ON public.nc_tasks(non_conformity_id);
CREATE INDEX idx_nc_tasks_company ON public.nc_tasks(company_id);
CREATE INDEX idx_nc_tasks_responsible ON public.nc_tasks(responsible_user_id);
CREATE INDEX idx_nc_tasks_type ON public.nc_tasks(task_type);
CREATE INDEX idx_nc_tasks_status ON public.nc_tasks(status);
CREATE INDEX idx_nc_tasks_due_date ON public.nc_tasks(due_date);

-- RLS
ALTER TABLE public.nc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_tasks_select" ON public.nc_tasks
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_tasks_insert" ON public.nc_tasks
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_tasks_update" ON public.nc_tasks
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "nc_tasks_delete" ON public.nc_tasks
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER update_nc_tasks_updated_at
  BEFORE UPDATE ON public.nc_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. Função para atualizar status de tarefas atrasadas
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_nc_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.nc_tasks 
  SET status = 'Atrasada', updated_at = now()
  WHERE due_date < CURRENT_DATE 
    AND status IN ('Pendente', 'Em Andamento');
    
  UPDATE public.nc_immediate_actions 
  SET status = 'Atrasada', updated_at = now()
  WHERE due_date < CURRENT_DATE 
    AND status IN ('Pendente', 'Em Andamento');
    
  UPDATE public.nc_action_plans 
  SET status = 'Atrasada', updated_at = now()
  WHERE when_deadline < CURRENT_DATE 
    AND status IN ('Planejada', 'Em Execução');
END;
$$;

-- =====================================================
-- 8. Função para obter estatísticas de NCs
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_nc_dashboard_stats(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  total_open INTEGER;
  total_closed INTEGER;
  by_stage JSONB;
  overdue_tasks INTEGER;
  tasks_by_type JSONB;
BEGIN
  -- Total abertas vs fechadas
  SELECT 
    COUNT(*) FILTER (WHERE status NOT IN ('Encerrada', 'Cancelada')),
    COUNT(*) FILTER (WHERE status = 'Encerrada')
  INTO total_open, total_closed
  FROM public.non_conformities
  WHERE company_id = p_company_id;
  
  -- Por etapa atual
  SELECT jsonb_object_agg(
    COALESCE(stage_name, 'unknown'),
    stage_count
  ) INTO by_stage
  FROM (
    SELECT 
      CASE current_stage
        WHEN 1 THEN 'Registro'
        WHEN 2 THEN 'Ação Imediata'
        WHEN 3 THEN 'Análise de Causa'
        WHEN 4 THEN 'Planejamento'
        WHEN 5 THEN 'Implementação'
        WHEN 6 THEN 'Eficácia'
        ELSE 'Outro'
      END as stage_name,
      COUNT(*) as stage_count
    FROM public.non_conformities
    WHERE company_id = p_company_id 
      AND status NOT IN ('Encerrada', 'Cancelada')
    GROUP BY current_stage
  ) stages;
  
  -- Tarefas atrasadas
  SELECT COUNT(*) INTO overdue_tasks
  FROM public.nc_tasks
  WHERE company_id = p_company_id 
    AND status = 'Atrasada';
  
  -- Tarefas por tipo
  SELECT jsonb_object_agg(task_type, task_count) INTO tasks_by_type
  FROM (
    SELECT task_type, COUNT(*) as task_count
    FROM public.nc_tasks
    WHERE company_id = p_company_id 
      AND status NOT IN ('Concluída', 'Cancelada')
    GROUP BY task_type
  ) tasks;
  
  result := jsonb_build_object(
    'total_open', total_open,
    'total_closed', total_closed,
    'by_stage', COALESCE(by_stage, '{}'::jsonb),
    'overdue_tasks', overdue_tasks,
    'tasks_by_type', COALESCE(tasks_by_type, '{}'::jsonb)
  );
  
  RETURN result;
END;
$$;
