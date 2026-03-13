ALTER TABLE public.sgq_iso_documents
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: usar elaborated_by_user_id como proxy para documentos existentes
UPDATE public.sgq_iso_documents
  SET created_by_user_id = elaborated_by_user_id
  WHERE created_by_user_id IS NULL;
