
-- SGQ/ISO Documents table (mirrors licenses structure)
CREATE TABLE public.sgq_iso_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_identifier_type TEXT NOT NULL DEFAULT 'Manual',
  document_identifier_other TEXT,
  document_number TEXT,
  issuing_body TEXT NOT NULL DEFAULT '',
  process_number TEXT,
  issue_date DATE,
  expiration_date DATE NOT NULL,
  renewal_required BOOLEAN NOT NULL DEFAULT true,
  renewal_alert_days INTEGER,
  notes TEXT,
  external_source_provider TEXT,
  external_source_reference TEXT,
  external_source_url TEXT,
  external_last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SGQ/ISO Document Settings
CREATE TABLE public.sgq_iso_document_settings (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE PRIMARY KEY,
  default_expiring_days INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SGQ Renewal Schedules (mirrors license_renewal_schedules)
CREATE TABLE public.sgq_renewal_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sgq_document_id UUID NOT NULL REFERENCES public.sgq_iso_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES auth.users(id),
  scheduled_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  protocol_deadline DATE,
  status public.license_renewal_status_enum NOT NULL DEFAULT 'nao_iniciado',
  protocol_number TEXT,
  renewed_expiration_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.sgq_iso_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgq_iso_document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgq_renewal_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for sgq_iso_documents
CREATE POLICY "Users can view sgq_iso_documents from their company"
  ON public.sgq_iso_documents FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert sgq_iso_documents for their company"
  ON public.sgq_iso_documents FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update sgq_iso_documents from their company"
  ON public.sgq_iso_documents FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete sgq_iso_documents from their company"
  ON public.sgq_iso_documents FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- Policies for sgq_iso_document_settings
CREATE POLICY "Users can view sgq_iso_document_settings from their company"
  ON public.sgq_iso_document_settings FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert sgq_iso_document_settings for their company"
  ON public.sgq_iso_document_settings FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update sgq_iso_document_settings from their company"
  ON public.sgq_iso_document_settings FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

-- Policies for sgq_renewal_schedules
CREATE POLICY "Users can view sgq_renewal_schedules from their company"
  ON public.sgq_renewal_schedules FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert sgq_renewal_schedules for their company"
  ON public.sgq_renewal_schedules FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update sgq_renewal_schedules from their company"
  ON public.sgq_renewal_schedules FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());
