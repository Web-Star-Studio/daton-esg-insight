-- Adicionar coluna updated_at à tabela notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar registros existentes para ter updated_at igual ao created_at
UPDATE notifications 
SET updated_at = created_at 
WHERE updated_at IS NULL;