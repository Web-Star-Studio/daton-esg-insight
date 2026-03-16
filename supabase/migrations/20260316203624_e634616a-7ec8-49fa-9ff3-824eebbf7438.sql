ALTER TABLE public.sgq_iso_documents
  DROP CONSTRAINT IF EXISTS sgq_iso_documents_elaborated_by_user_id_fkey,
  DROP CONSTRAINT IF EXISTS sgq_iso_documents_approved_by_user_id_fkey;

ALTER TABLE public.licenses
  DROP CONSTRAINT IF EXISTS licenses_responsible_user_id_fkey;

ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS branch_ids UUID[] DEFAULT '{}';