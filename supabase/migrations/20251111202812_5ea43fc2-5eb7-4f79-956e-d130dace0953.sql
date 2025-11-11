-- Enable authenticated users to SELECT objects from 'documents' bucket
-- when they belong to the same company as the document record
CREATE POLICY "documents_read_by_company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1
    FROM public.documents d
    JOIN public.profiles p ON p.company_id = d.company_id
    WHERE d.file_path = storage.objects.name
      AND p.id = auth.uid()
  )
);
