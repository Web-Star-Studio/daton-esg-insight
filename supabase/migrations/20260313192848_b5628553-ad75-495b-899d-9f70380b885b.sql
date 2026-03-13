
-- Add missing is_approved and approved_at columns to sgq_iso_documents
ALTER TABLE public.sgq_iso_documents
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

NOTIFY pgrst, 'reload schema';
