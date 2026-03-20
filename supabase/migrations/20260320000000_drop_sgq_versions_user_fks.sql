-- Drop FK constraints on sgq_document_versions so that employee IDs
-- (from the employees table) can be stored as elaborated_by_user_id,
-- matching the same change made to sgq_iso_documents in 20260316000000.
ALTER TABLE public.sgq_document_versions
  DROP CONSTRAINT IF EXISTS sgq_document_versions_elaborated_by_user_id_fkey,
  DROP CONSTRAINT IF EXISTS sgq_document_versions_approved_by_user_id_fkey;
