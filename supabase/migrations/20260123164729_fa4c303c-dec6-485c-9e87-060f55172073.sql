-- Remover índice único global de CNPJ
DROP INDEX IF EXISTS idx_branches_cnpj_unique;

-- Criar novo índice único composto (company_id + cnpj)
-- Permite que cada empresa tenha seus próprios registros de CNPJ independentes
CREATE UNIQUE INDEX idx_branches_company_cnpj_unique 
ON branches (company_id, cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';