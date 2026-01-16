-- Adicionar status 'parcial' ao overall_status se houver constraint
-- Verificar se a constraint existe e atualizar

DO $$
BEGIN
  -- Verificar se existe alguma constraint de check no campo overall_status
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'legislations' AND column_name = 'overall_status'
  ) THEN
    -- Remover constraint existente se houver
    ALTER TABLE legislations DROP CONSTRAINT IF EXISTS legislations_overall_status_check;
  END IF;
END $$;

-- Comentário explicando os valores válidos para overall_status
COMMENT ON COLUMN legislations.overall_status IS 'Status de conformidade: pending, conforme, para_conhecimento, adequacao, plano_acao, na, parcial';