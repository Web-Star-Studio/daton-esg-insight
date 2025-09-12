-- Add Storage RLS policies for documents bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL
);

-- Allow users to view their own company documents
CREATE POLICY "Users can view their company documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.file_path = name AND 
          d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- Allow users to update their company documents  
CREATE POLICY "Users can update their company documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.file_path = name AND 
          d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- Allow users to delete their company documents
CREATE POLICY "Users can delete their company documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.file_path = name AND 
          d.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);