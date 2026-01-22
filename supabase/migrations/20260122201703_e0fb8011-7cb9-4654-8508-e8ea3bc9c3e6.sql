-- Add sector column to non_conformities table (using text for simplicity)
ALTER TABLE public.non_conformities 
ADD COLUMN IF NOT EXISTS sector TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.non_conformities.sector IS 'Setor da não conformidade: Operacional, Frota, Administrativo, Lavagem, Abastecimento, etc.';