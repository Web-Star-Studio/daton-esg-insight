-- Criar política RLS para permitir upload de documentos de funcionários baseado em company_id
CREATE POLICY "Company users can upload employee documents to company folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Adicionar política de SELECT para permitir downloads
CREATE POLICY "Company users can view employee documents from company folders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Adicionar política de DELETE para permitir remoção
CREATE POLICY "Company users can delete employee documents from company folders"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);