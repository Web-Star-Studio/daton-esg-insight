-- Adicionar colunas de endereço separadas para supplier_management
ALTER TABLE supplier_management
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Comentários para documentação
COMMENT ON COLUMN supplier_management.cep IS 'Código postal (CEP)';
COMMENT ON COLUMN supplier_management.street IS 'Nome da rua/logradouro';
COMMENT ON COLUMN supplier_management.street_number IS 'Número do endereço';
COMMENT ON COLUMN supplier_management.neighborhood IS 'Bairro';
COMMENT ON COLUMN supplier_management.city IS 'Cidade';
COMMENT ON COLUMN supplier_management.state IS 'Estado (UF)';