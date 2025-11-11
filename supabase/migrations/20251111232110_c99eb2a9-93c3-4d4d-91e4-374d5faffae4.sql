-- Adicionar configuração de normalização nas regras de deduplicação
ALTER TABLE public.deduplication_rules 
ADD COLUMN IF NOT EXISTS normalization_options JSONB DEFAULT '{
  "trim": true,
  "lowercase": true,
  "remove_accents": true,
  "remove_special_chars": false,
  "normalize_whitespace": true
}'::jsonb;

COMMENT ON COLUMN public.deduplication_rules.normalization_options IS 'Opções de normalização aplicadas antes da comparação de campos únicos';

-- Função para normalizar texto
CREATE OR REPLACE FUNCTION public.normalize_text(input_text TEXT, options JSONB DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT;
  opts JSONB;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  result := input_text;
  
  -- Opções padrão se não fornecidas
  opts := COALESCE(options, '{
    "trim": true,
    "lowercase": true,
    "remove_accents": true,
    "remove_special_chars": false,
    "normalize_whitespace": true
  }'::jsonb);
  
  -- Trim (remover espaços nas pontas)
  IF (opts->>'trim')::boolean THEN
    result := TRIM(result);
  END IF;
  
  -- Normalizar espaços múltiplos
  IF (opts->>'normalize_whitespace')::boolean THEN
    result := REGEXP_REPLACE(result, '\s+', ' ', 'g');
  END IF;
  
  -- Lowercase
  IF (opts->>'lowercase')::boolean THEN
    result := LOWER(result);
  END IF;
  
  -- Remover acentos usando transliteração
  IF (opts->>'remove_accents')::boolean THEN
    result := TRANSLATE(result,
      'áàâãäåāăąèéêëēĕėęěìíîïìĩīĭḩóôõöōŏőùúûüũūŭůÁÀÂÃÄÅĀĂĄÈÉÊËĒĔĖĘĚÌÍÎÏÌĨĪĬḨÓÔÕÖŌŎŐÙÚÛÜŨŪŬŮçÇñÑ',
      'aaaaaaaaaeeeeeeeeeiiiiiiiihooooooouuuuuuuuAAAAAAAAAEEEEEEEEEIIIIIIIIHOOOOOOOUUUUUUUUcCnN'
    );
  END IF;
  
  -- Remover caracteres especiais (mantém apenas letras, números e espaços)
  IF (opts->>'remove_special_chars')::boolean THEN
    result := REGEXP_REPLACE(result, '[^a-zA-Z0-9\s]', '', 'g');
  END IF;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.normalize_text IS 'Normaliza texto para comparação de deduplicação (trim, lowercase, remove acentos, etc)';

-- Exemplos de uso:
-- SELECT normalize_text('  João da Silva  '); -- retorna: 'joao da silva'
-- SELECT normalize_text('María José', '{"lowercase": false, "remove_accents": true}'::jsonb); -- retorna: 'Maria Jose'