-- Add CNPJ column to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

-- Create unique index to prevent duplicate CNPJs (only for non-empty values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_cnpj_unique 
ON branches (cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';