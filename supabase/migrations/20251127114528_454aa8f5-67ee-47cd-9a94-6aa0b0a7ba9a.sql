-- Create storage bucket for audit evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-evidence',
  'audit-evidence',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for viewing evidence (public, anyone can view)
CREATE POLICY "Anyone can view audit evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'audit-evidence');

-- Storage policy for uploading evidence (only authenticated users)
CREATE POLICY "Authenticated users can upload audit evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audit-evidence' 
  AND auth.role() = 'authenticated'
);

-- Storage policy for deleting evidence (only the uploader or admins)
CREATE POLICY "Users can delete their own evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audit-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);