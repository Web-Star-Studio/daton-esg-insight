-- Adicionar colunas para controle de status do fornecedor
ALTER TABLE supplier_management
ADD COLUMN IF NOT EXISTS inactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id);

-- Comentários para documentação
COMMENT ON COLUMN supplier_management.inactivation_reason IS 'Motivo da inativação ou suspensão do fornecedor';
COMMENT ON COLUMN supplier_management.status_changed_at IS 'Data/hora da última alteração de status';
COMMENT ON COLUMN supplier_management.status_changed_by IS 'Usuário que alterou o status';