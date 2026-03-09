
-- Add new columns to sgq_iso_documents
ALTER TABLE sgq_iso_documents
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS elaborated_by_user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_by_user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_version_number integer NOT NULL DEFAULT 1;

-- sgq_document_versions
CREATE TABLE sgq_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  version_number integer NOT NULL,
  changes_summary text,
  elaborated_by_user_id uuid REFERENCES profiles(id),
  approved_by_user_id uuid REFERENCES profiles(id),
  approved_at timestamptz,
  attachment_document_id uuid REFERENCES documents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sgq_document_id, version_number)
);

ALTER TABLE sgq_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company sgq versions"
  ON sgq_document_versions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company sgq versions"
  ON sgq_document_versions FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update own company sgq versions"
  ON sgq_document_versions FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete own company sgq versions"
  ON sgq_document_versions FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- sgq_document_references
CREATE TABLE sgq_document_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  referenced_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sgq_document_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company sgq references"
  ON sgq_document_references FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company sgq references"
  ON sgq_document_references FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete own company sgq references"
  ON sgq_document_references FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- sgq_read_campaigns
CREATE TABLE sgq_read_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  version_number integer,
  title text NOT NULL,
  message text,
  due_at timestamptz,
  created_by_user_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sgq_read_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company sgq campaigns"
  ON sgq_read_campaigns FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company sgq campaigns"
  ON sgq_read_campaigns FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update own company sgq campaigns"
  ON sgq_read_campaigns FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

-- sgq_read_recipients
CREATE TABLE sgq_read_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES sgq_read_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  confirmed_at timestamptz,
  confirmation_note text,
  due_at timestamptz
);

ALTER TABLE sgq_read_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company sgq recipients"
  ON sgq_read_recipients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sgq_read_campaigns c
      WHERE c.id = sgq_read_recipients.campaign_id
        AND c.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert sgq recipients"
  ON sgq_read_recipients FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sgq_read_campaigns c
      WHERE c.id = sgq_read_recipients.campaign_id
        AND c.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update own sgq recipients"
  ON sgq_read_recipients FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
