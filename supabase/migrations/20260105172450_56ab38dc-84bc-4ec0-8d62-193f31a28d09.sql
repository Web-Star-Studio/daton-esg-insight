-- Create email mailing lists table
CREATE TABLE public.email_mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mailing list contacts table
CREATE TABLE public.mailing_list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES public.email_mailing_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mailing_list_id, email)
);

-- Create mailing list forms junction table
CREATE TABLE public.mailing_list_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES public.email_mailing_lists(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mailing_list_id, form_id)
);

-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mailing_list_id UUID NOT NULL REFERENCES public.email_mailing_lists(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'draft',
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  responded_count INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID NOT NULL
);

-- Create email campaign sends table
CREATE TABLE public.email_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.mailing_list_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  error_message TEXT,
  tracking_id UUID DEFAULT gen_random_uuid()
);

-- Enable RLS on all tables
ALTER TABLE public.email_mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_mailing_lists
CREATE POLICY "Users can view mailing lists from their company"
ON public.email_mailing_lists FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create mailing lists for their company"
ON public.email_mailing_lists FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update mailing lists from their company"
ON public.email_mailing_lists FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete mailing lists from their company"
ON public.email_mailing_lists FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for mailing_list_contacts
CREATE POLICY "Users can view contacts from their company lists"
ON public.mailing_list_contacts FOR SELECT
USING (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create contacts in their company lists"
ON public.mailing_list_contacts FOR INSERT
WITH CHECK (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can update contacts in their company lists"
ON public.mailing_list_contacts FOR UPDATE
USING (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can delete contacts from their company lists"
ON public.mailing_list_contacts FOR DELETE
USING (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

-- RLS Policies for mailing_list_forms
CREATE POLICY "Users can view form links from their company"
ON public.mailing_list_forms FOR SELECT
USING (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create form links for their company"
ON public.mailing_list_forms FOR INSERT
WITH CHECK (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can delete form links from their company"
ON public.mailing_list_forms FOR DELETE
USING (mailing_list_id IN (
  SELECT id FROM public.email_mailing_lists 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

-- RLS Policies for email_campaigns
CREATE POLICY "Users can view campaigns from their company"
ON public.email_campaigns FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create campaigns for their company"
ON public.email_campaigns FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update campaigns from their company"
ON public.email_campaigns FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete campaigns from their company"
ON public.email_campaigns FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for email_campaign_sends
CREATE POLICY "Users can view sends from their company campaigns"
ON public.email_campaign_sends FOR SELECT
USING (campaign_id IN (
  SELECT id FROM public.email_campaigns 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create sends for their company campaigns"
ON public.email_campaign_sends FOR INSERT
WITH CHECK (campaign_id IN (
  SELECT id FROM public.email_campaigns 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can update sends from their company campaigns"
ON public.email_campaign_sends FOR UPDATE
USING (campaign_id IN (
  SELECT id FROM public.email_campaigns 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

-- Create indexes for better performance
CREATE INDEX idx_mailing_lists_company ON public.email_mailing_lists(company_id);
CREATE INDEX idx_mailing_contacts_list ON public.mailing_list_contacts(mailing_list_id);
CREATE INDEX idx_mailing_forms_list ON public.mailing_list_forms(mailing_list_id);
CREATE INDEX idx_mailing_forms_form ON public.mailing_list_forms(form_id);
CREATE INDEX idx_campaigns_company ON public.email_campaigns(company_id);
CREATE INDEX idx_campaigns_list ON public.email_campaigns(mailing_list_id);
CREATE INDEX idx_campaign_sends_campaign ON public.email_campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_tracking ON public.email_campaign_sends(tracking_id);

-- Create updated_at trigger for mailing lists
CREATE TRIGGER update_email_mailing_lists_updated_at
BEFORE UPDATE ON public.email_mailing_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();