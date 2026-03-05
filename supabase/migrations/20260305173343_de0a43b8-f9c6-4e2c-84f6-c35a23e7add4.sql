
-- Table for many-to-many relationship between documents and branches
CREATE TABLE public.document_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, branch_id)
);

ALTER TABLE public.document_branches ENABLE ROW LEVEL SECURITY;

-- RLS: users can see document_branches for their company
CREATE POLICY "Users can view document_branches for their company"
  ON public.document_branches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_branches.document_id
      AND d.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert document_branches for their company"
  ON public.document_branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_branches.document_id
      AND d.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete document_branches for their company"
  ON public.document_branches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_branches.document_id
      AND d.company_id = public.get_user_company_id()
    )
  );
