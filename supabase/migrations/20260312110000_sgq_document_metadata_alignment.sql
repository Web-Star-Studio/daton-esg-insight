ALTER TABLE public.sgq_iso_documents
  ADD COLUMN IF NOT EXISTS norm_reference TEXT,
  ADD COLUMN IF NOT EXISTS responsible_department TEXT;

CREATE TABLE IF NOT EXISTS public.sgq_document_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id UUID NOT NULL REFERENCES public.sgq_iso_documents(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sgq_document_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_sgq_document_branches_document
  ON public.sgq_document_branches(sgq_document_id);

CREATE INDEX IF NOT EXISTS idx_sgq_document_branches_branch
  ON public.sgq_document_branches(branch_id);

INSERT INTO public.sgq_document_branches (sgq_document_id, branch_id)
SELECT id, branch_id
FROM public.sgq_iso_documents
WHERE branch_id IS NOT NULL
ON CONFLICT (sgq_document_id, branch_id) DO NOTHING;

ALTER TABLE public.sgq_document_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sgq document branches from their company" ON public.sgq_document_branches;
CREATE POLICY "Users can view sgq document branches from their company"
  ON public.sgq_document_branches FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sgq_iso_documents d
      WHERE d.id = sgq_document_branches.sgq_document_id
        AND d.company_id = public.get_user_company_id()
    )
  );

DROP POLICY IF EXISTS "Users can insert sgq document branches for their company" ON public.sgq_document_branches;
CREATE POLICY "Users can insert sgq document branches for their company"
  ON public.sgq_document_branches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sgq_iso_documents d
      WHERE d.id = sgq_document_branches.sgq_document_id
        AND d.company_id = public.get_user_company_id()
    )
  );

DROP POLICY IF EXISTS "Users can delete sgq document branches from their company" ON public.sgq_document_branches;
CREATE POLICY "Users can delete sgq document branches from their company"
  ON public.sgq_document_branches FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sgq_iso_documents d
      WHERE d.id = sgq_document_branches.sgq_document_id
        AND d.company_id = public.get_user_company_id()
    )
  );
