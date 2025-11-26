-- Fase 1: Estrutura de Dados para Sistema de Auditoria ISO

-- Tabela de Programas de Auditoria (planejamento anual/multi-anual)
CREATE TABLE public.audit_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  objectives TEXT,
  scope_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  responsible_user_id UUID REFERENCES public.profiles(id),
  approved_by_user_id UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  risk_criteria JSONB,
  resources_budget DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Planos de Auditoria Individual
CREATE TABLE public.audit_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.audit_programs(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objective TEXT,
  scope_areas TEXT[],
  criteria JSONB,
  audit_type TEXT NOT NULL DEFAULT 'internal' CHECK (audit_type IN ('first_party', 'second_party', 'third_party', 'internal')),
  lead_auditor_id UUID REFERENCES public.profiles(id),
  team_members JSONB,
  planned_date TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(5,2),
  location TEXT,
  methodology TEXT,
  sampling_plan TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'cancelled')),
  opening_meeting_date TIMESTAMP WITH TIME ZONE,
  closing_meeting_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Áreas/Processos Auditáveis
CREATE TABLE public.audit_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  process_owner_id UUID REFERENCES public.profiles(id),
  applicable_standards JSONB,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  last_audit_date DATE,
  next_audit_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Checklists por Norma
CREATE TABLE public.audit_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  standard TEXT NOT NULL CHECK (standard IN ('ISO_9001', 'ISO_14001', 'ISO_39001', 'ISO_45001', 'Custom')),
  version TEXT,
  clause_reference TEXT,
  questions JSONB NOT NULL,
  is_template BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Respostas do Checklist
CREATE TABLE public.audit_checklist_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.audit_checklists(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('conforming', 'non_conforming', 'not_applicable', 'observation', 'opportunity')),
  evidence_notes TEXT,
  evidence_documents JSONB,
  auditor_id UUID REFERENCES public.profiles(id),
  audited_by TEXT,
  response_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Perfil dos Auditores
CREATE TABLE public.auditor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  qualification_level TEXT NOT NULL DEFAULT 'internal' CHECK (qualification_level IN ('internal', 'lead', 'external', 'trainee')),
  certifications JSONB,
  audit_hours_logged INTEGER DEFAULT 0,
  competencies JSONB,
  independence_declarations TEXT,
  last_training_date DATE,
  max_audits_per_year INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Tabela de Biblioteca de Requisitos ISO
CREATE TABLE public.iso_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard TEXT NOT NULL CHECK (standard IN ('ISO_9001', 'ISO_14001', 'ISO_39001', 'ISO_45001')),
  version TEXT NOT NULL,
  clause_number TEXT NOT NULL,
  clause_title TEXT NOT NULL,
  description TEXT NOT NULL,
  guidance_notes TEXT,
  evidence_examples TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard, version, clause_number)
);

-- Tabela de Notificações de Auditoria
CREATE TABLE public.audit_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('scheduled', 'reminder', 'finding', 'overdue', 'escalation', 'completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_audit_programs_company ON public.audit_programs(company_id);
CREATE INDEX idx_audit_programs_year ON public.audit_programs(year);
CREATE INDEX idx_audit_plans_audit ON public.audit_plans(audit_id);
CREATE INDEX idx_audit_plans_program ON public.audit_plans(program_id);
CREATE INDEX idx_audit_areas_company ON public.audit_areas(company_id);
CREATE INDEX idx_audit_checklists_company ON public.audit_checklists(company_id);
CREATE INDEX idx_audit_checklists_standard ON public.audit_checklists(standard);
CREATE INDEX idx_audit_responses_audit ON public.audit_checklist_responses(audit_id);
CREATE INDEX idx_auditor_profiles_user ON public.auditor_profiles(user_id);
CREATE INDEX idx_iso_requirements_standard ON public.iso_requirements(standard);
CREATE INDEX idx_audit_notifications_user ON public.audit_notifications(user_id);
CREATE INDEX idx_audit_notifications_audit ON public.audit_notifications(audit_id);

-- Enable RLS
ALTER TABLE public.audit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view audit programs of their company" ON public.audit_programs
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create audit programs for their company" ON public.audit_programs
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update audit programs of their company" ON public.audit_programs
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view audit plans of their company" ON public.audit_plans
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create audit plans for their company" ON public.audit_plans
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update audit plans of their company" ON public.audit_plans
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view audit areas of their company" ON public.audit_areas
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage audit areas of their company" ON public.audit_areas
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view checklists of their company" ON public.audit_checklists
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage checklists of their company" ON public.audit_checklists
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view responses" ON public.audit_checklist_responses
  FOR SELECT USING (audit_id IN (SELECT id FROM public.audits WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can manage responses" ON public.audit_checklist_responses
  FOR ALL USING (audit_id IN (SELECT id FROM public.audits WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can view auditor profiles of their company" ON public.auditor_profiles
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage auditor profiles" ON public.auditor_profiles
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Anyone can view ISO requirements" ON public.iso_requirements
  FOR SELECT USING (true);

CREATE POLICY "Users can view their notifications" ON public.audit_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.audit_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audit_programs_updated_at BEFORE UPDATE ON public.audit_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_plans_updated_at BEFORE UPDATE ON public.audit_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_areas_updated_at BEFORE UPDATE ON public.audit_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_checklists_updated_at BEFORE UPDATE ON public.audit_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_responses_updated_at BEFORE UPDATE ON public.audit_checklist_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auditor_profiles_updated_at BEFORE UPDATE ON public.auditor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();