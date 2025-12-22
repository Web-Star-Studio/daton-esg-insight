-- Criar bucket público para logos de formulários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-logos', 
  'form-logos', 
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'form-logos');

CREATE POLICY "Logos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-logos');

CREATE POLICY "Usuários autenticados podem deletar suas logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'form-logos');

CREATE POLICY "Usuários autenticados podem atualizar suas logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'form-logos');