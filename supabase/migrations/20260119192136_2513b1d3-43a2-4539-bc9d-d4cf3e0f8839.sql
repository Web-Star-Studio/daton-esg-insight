-- Create storage bucket for NC action evidence attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('nc-evidence', 'nc-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for nc-evidence bucket
CREATE POLICY "Users can view nc evidence files"
ON storage.objects FOR SELECT
USING (bucket_id = 'nc-evidence');

CREATE POLICY "Authenticated users can upload nc evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nc-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their nc evidence files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nc-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their nc evidence files"
ON storage.objects FOR DELETE
USING (bucket_id = 'nc-evidence' AND auth.role() = 'authenticated');

-- Add attachments column to nc_action_plans if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nc_action_plans' 
    AND column_name = 'evidence_attachments'
  ) THEN
    ALTER TABLE public.nc_action_plans ADD COLUMN evidence_attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;