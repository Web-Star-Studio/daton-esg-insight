-- Add is_approved column to track explicit approval by designated approver
ALTER TABLE public.sgq_iso_documents
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Mark existing documents as approved (they were already live before this workflow)
UPDATE public.sgq_iso_documents
SET is_approved = true
WHERE approved_at IS NOT NULL;

-- Mark inactive campaigns as approved-linked for existing documents
-- (no change needed — existing campaigns are already 'active')
