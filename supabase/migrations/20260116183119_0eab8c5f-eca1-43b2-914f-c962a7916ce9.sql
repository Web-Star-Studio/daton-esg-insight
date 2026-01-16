-- Add extra columns to support Gabardo Excel format
ALTER TABLE legislations 
ADD COLUMN IF NOT EXISTS compliance_details text,
ADD COLUMN IF NOT EXISTS general_notes text,
ADD COLUMN IF NOT EXISTS states_list text;

COMMENT ON COLUMN legislations.compliance_details IS 'Detalhes de como a legislação é atendida (Observações como é atendido)';
COMMENT ON COLUMN legislations.general_notes IS 'Notas gerais, responsáveis e datas de envio';
COMMENT ON COLUMN legislations.states_list IS 'Lista de UFs quando aplicável a múltiplos estados';