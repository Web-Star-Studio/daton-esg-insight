-- Aumenta o limite de legislations.norm_type de VARCHAR(50) para VARCHAR(100).
-- Motivação: a planilha de legislações federais contém classificações
-- compostas longas como "DECLARAÇÃO DE CONFERÊNCIA DA ONU NO AMBIENTE HUMANO"
-- (52 chars), que estouravam o limite antigo durante a importação.
ALTER TABLE public.legislations
  ALTER COLUMN norm_type TYPE VARCHAR(100);

COMMENT ON COLUMN public.legislations.norm_type IS
  'Tipo/classificação da norma (Lei, Decreto, Portaria, NBR, ou classificações compostas). Limite: 100 caracteres.';