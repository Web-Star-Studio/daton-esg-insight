-- Normalizar file_paths existentes (remover prefixo 'documents/' duplicado)
UPDATE public.documents
SET file_path = regexp_replace(file_path, '^documents/', '', 'g')
WHERE file_path LIKE 'documents/%';

-- Criar índice para melhorar performance de buscas por file_path
CREATE INDEX IF NOT EXISTS idx_documents_file_path ON public.documents(file_path);

-- Log de quantos registros foram normalizados
DO $$
DECLARE
  normalized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO normalized_count
  FROM public.documents
  WHERE file_path NOT LIKE 'documents/%';
  
  RAISE NOTICE 'File paths normalizados: % documentos', normalized_count;
END $$;