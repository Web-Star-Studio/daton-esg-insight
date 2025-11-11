-- PHASE 1: Garantir que os buckets de storage existam e tenham políticas corretas

-- Criar bucket 'documents' se não existir (para o sistema de documentos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Criar bucket 'uploads' se não existir (para extraction service)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads', 
  'uploads', 
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

-- POLÍTICAS RLS PARA BUCKET 'documents'

-- Permitir usuários visualizarem documentos da própria empresa
DROP POLICY IF EXISTS "Users can view their company documents" ON storage.objects;
CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT d.company_id::text 
    FROM public.documents d
    JOIN public.profiles p ON d.company_id = p.company_id
    WHERE p.id = auth.uid()
    AND d.file_path = name
  )
);

-- Permitir usuários fazerem upload de documentos para sua empresa
DROP POLICY IF EXISTS "Users can upload documents to their company" ON storage.objects;
CREATE POLICY "Users can upload documents to their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IN (SELECT id FROM public.profiles)
);

-- Permitir usuários atualizarem documentos da própria empresa
DROP POLICY IF EXISTS "Users can update their company documents" ON storage.objects;
CREATE POLICY "Users can update their company documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT d.company_id::text 
    FROM public.documents d
    JOIN public.profiles p ON d.company_id = p.company_id
    WHERE p.id = auth.uid()
    AND d.file_path = name
  )
);

-- Permitir usuários deletarem documentos da própria empresa
DROP POLICY IF EXISTS "Users can delete their company documents" ON storage.objects;
CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT d.company_id::text 
    FROM public.documents d
    JOIN public.profiles p ON d.company_id = p.company_id
    WHERE p.id = auth.uid()
    AND d.file_path = name
  )
);

-- POLÍTICAS RLS PARA BUCKET 'uploads'

-- Permitir usuários visualizarem seus próprios uploads
DROP POLICY IF EXISTS "Users can view their own uploads" ON storage.objects;
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários fazerem upload para seu próprio diretório
DROP POLICY IF EXISTS "Users can upload to their own directory" ON storage.objects;
CREATE POLICY "Users can upload to their own directory"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários atualizarem seus próprios uploads
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários deletarem seus próprios uploads
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);