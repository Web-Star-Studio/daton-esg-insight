UPDATE public.sgq_iso_documents
SET is_approved = true
WHERE created_by_user_id IS NULL
  AND is_approved = false;