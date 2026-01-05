-- Atualizar limite de tamanho do bucket form-logos para 5MB
UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5MB em bytes
WHERE id = 'form-logos';