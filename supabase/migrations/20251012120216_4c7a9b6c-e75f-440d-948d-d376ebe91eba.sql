-- Create license_renewal_schedules table
CREATE TABLE IF NOT EXISTS public.license_renewal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scheduled_start_date DATE NOT NULL,
  protocol_deadline DATE NOT NULL,
  expected_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notification_config JSONB DEFAULT '{"reminders": [7, 15, 30], "channels": ["in_app"]}'::jsonb,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_renewal_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their company renewal schedules"
ON public.license_renewal_schedules
FOR ALL
USING (company_id = get_user_company_id());

-- Create license_report_history table
CREATE TABLE IF NOT EXISTS public.license_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('executive', 'conditions_detailed', 'compliance', 'renewal_dossier')),
  report_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path_pdf TEXT,
  file_path_xlsx TEXT,
  generated_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company report history"
ON public.license_report_history
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create reports for their company"
ON public.license_report_history
FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND generated_by_user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_renewal_schedules_license ON public.license_renewal_schedules(license_id);
CREATE INDEX IF NOT EXISTS idx_renewal_schedules_company ON public.license_renewal_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_renewal_schedules_status ON public.license_renewal_schedules(status);

CREATE INDEX IF NOT EXISTS idx_report_history_license ON public.license_report_history(license_id);
CREATE INDEX IF NOT EXISTS idx_report_history_company ON public.license_report_history(company_id);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON public.license_report_history(report_type);