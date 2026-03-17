-- Documentos criados antes do workflow de aprovação (sem created_by_user_id)
-- já estavam "em uso" e devem ser tratados como aprovados
UPDATE public.sgq_iso_documents
SET is_approved = true
WHERE created_by_user_id IS NULL
  AND is_approved = false;
