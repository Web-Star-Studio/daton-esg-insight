CREATE TABLE public.document_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL DEFAULT 'update',
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change logs for their company documents"
  ON public.document_change_log FOR SELECT TO authenticated
  USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.profiles p ON p.company_id = d.company_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert change logs for their company documents"
  ON public.document_change_log FOR INSERT TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.profiles p ON p.company_id = d.company_id
      WHERE p.id = auth.uid()
    )
  );

CREATE INDEX idx_document_change_log_document_id ON public.document_change_log(document_id);
CREATE INDEX idx_document_change_log_created_at ON public.document_change_log(created_at DESC);