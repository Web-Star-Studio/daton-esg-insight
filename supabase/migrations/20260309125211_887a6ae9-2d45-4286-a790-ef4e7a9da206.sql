
-- =============================================
-- SGQ Document Center: missing tables repair
-- =============================================

-- 1. document_control_profiles
CREATE TABLE IF NOT EXISTS public.document_control_profiles (
  document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  code TEXT,
  document_type_label TEXT NOT NULL DEFAULT '',
  norm_reference TEXT,
  issuer_name TEXT,
  confidentiality_level TEXT NOT NULL DEFAULT 'internal',
  validity_start_date DATE,
  validity_end_date DATE,
  review_due_date DATE,
  responsible_department TEXT,
  controlled_copy BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_control_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view control profiles for company docs"
  ON public.document_control_profiles FOR SELECT TO authenticated
  USING (document_id IN (
    SELECT d.id FROM public.documents d WHERE d.company_id = public.get_user_company_id()
  ));

CREATE POLICY "Users can insert control profiles for company docs"
  ON public.document_control_profiles FOR INSERT TO authenticated
  WITH CHECK (document_id IN (
    SELECT d.id FROM public.documents d WHERE d.company_id = public.get_user_company_id()
  ));

CREATE POLICY "Users can update control profiles for company docs"
  ON public.document_control_profiles FOR UPDATE TO authenticated
  USING (document_id IN (
    SELECT d.id FROM public.documents d WHERE d.company_id = public.get_user_company_id()
  ));

-- 2. document_read_campaigns
CREATE TABLE IF NOT EXISTS public.document_read_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_read_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage read campaigns"
  ON public.document_read_campaigns FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_read_campaigns_document ON public.document_read_campaigns(document_id);

-- 3. document_read_recipients
CREATE TABLE IF NOT EXISTS public.document_read_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.document_read_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  confirmation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_read_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage read recipients"
  ON public.document_read_recipients FOR ALL TO authenticated
  USING (campaign_id IN (
    SELECT id FROM public.document_read_campaigns WHERE company_id = public.get_user_company_id()
  ))
  WITH CHECK (campaign_id IN (
    SELECT id FROM public.document_read_campaigns WHERE company_id = public.get_user_company_id()
  ));

CREATE INDEX IF NOT EXISTS idx_read_recipients_campaign ON public.document_read_recipients(campaign_id);

-- 4. document_requests
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL DEFAULT 'new_version',
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  fulfilled_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  fulfilled_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage document requests"
  ON public.document_requests FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_document_requests_target ON public.document_requests(target_document_id);

-- 5. document_relations
CREATE TABLE IF NOT EXISTS public.document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'references',
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage document relations"
  ON public.document_relations FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_document_relations_source ON public.document_relations(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relations_target ON public.document_relations(target_document_id);

-- 6. Extend document_change_log with missing columns
ALTER TABLE public.document_change_log ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.document_change_log ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.document_change_log ADD COLUMN IF NOT EXISTS diff JSONB;
ALTER TABLE public.document_change_log ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
