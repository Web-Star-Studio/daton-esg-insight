
-- Table: laia_revisions
CREATE TABLE public.laia_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  revision_number INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_by UUID REFERENCES public.profiles(id),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, revision_number)
);

-- Table: laia_revision_changes
CREATE TABLE public.laia_revision_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES public.laia_revisions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  branch_id UUID REFERENCES public.branches(id),
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.laia_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laia_revision_changes ENABLE ROW LEVEL SECURITY;

-- Policies for laia_revisions
CREATE POLICY "Users can view revisions from their company"
  ON public.laia_revisions FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert revisions for their company"
  ON public.laia_revisions FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update revisions from their company"
  ON public.laia_revisions FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete revisions from their company"
  ON public.laia_revisions FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- Policies for laia_revision_changes (via revision's company_id)
CREATE POLICY "Users can view revision changes from their company"
  ON public.laia_revision_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.laia_revisions r
      WHERE r.id = revision_id AND r.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert revision changes for their company"
  ON public.laia_revision_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.laia_revisions r
      WHERE r.id = revision_id AND r.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete revision changes from their company"
  ON public.laia_revision_changes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.laia_revisions r
      WHERE r.id = revision_id AND r.company_id = public.get_user_company_id()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_laia_revisions_updated_at
  BEFORE UPDATE ON public.laia_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_laia_revision_changes_revision_id ON public.laia_revision_changes(revision_id);
CREATE INDEX idx_laia_revisions_company_status ON public.laia_revisions(company_id, status);
