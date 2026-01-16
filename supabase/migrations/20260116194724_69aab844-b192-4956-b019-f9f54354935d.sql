-- Adicionar coluna municipalities_list para múltiplos municípios
ALTER TABLE legislations 
ADD COLUMN IF NOT EXISTS municipalities_list text;

COMMENT ON COLUMN legislations.municipalities_list IS 'Lista de municípios quando aplicável a múltiplas cidades';