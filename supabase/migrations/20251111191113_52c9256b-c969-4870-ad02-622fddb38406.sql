-- Adicionar configuração de processamento automático de IA
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS auto_ai_processing BOOLEAN DEFAULT false;

COMMENT ON COLUMN companies.auto_ai_processing IS 'Habilita processamento automático de IA após upload de documentos';

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_companies_auto_ai_processing ON companies(auto_ai_processing) WHERE auto_ai_processing = true;