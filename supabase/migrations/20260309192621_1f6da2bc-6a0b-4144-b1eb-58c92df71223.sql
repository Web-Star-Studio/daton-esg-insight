
-- Create sgq_review_requests table for review/approval workflow
CREATE TABLE public.sgq_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES public.sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  requested_by_user_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending',
  changes_summary text NOT NULL,
  attachment_document_id uuid REFERENCES public.documents(id),
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sgq_review_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: same company
CREATE POLICY "sgq_review_requests_select" ON public.sgq_review_requests
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

-- INSERT: same company
CREATE POLICY "sgq_review_requests_insert" ON public.sgq_review_requests
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

-- UPDATE: only the designated reviewer can update
CREATE POLICY "sgq_review_requests_update" ON public.sgq_review_requests
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id() AND reviewer_user_id = auth.uid())
  WITH CHECK (company_id = public.get_user_company_id() AND reviewer_user_id = auth.uid());

-- Also restrict sgq_read_recipients UPDATE to own user only (belt-and-suspenders with RLS)
DROP POLICY IF EXISTS "sgq_read_recipients_update" ON public.sgq_read_recipients;
CREATE POLICY "sgq_read_recipients_update" ON public.sgq_read_recipients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
