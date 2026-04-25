-- Reset das evidências de import — etapa final: Transportes Gabardo +
-- índice único parcial em legislation_evidences.
--
-- Contexto: a Gabardo tem 1.524 linhas em legislation_evidences geradas
-- pelo import (mesmo bug histórico que afetou a Fike). Aplicamos a mesma
-- estratégia validada na Fike: apaga tudo do import e o usuário re-importa
-- a partir das planilhas (federais, NBR, internacional) com o código já
-- corrigido (commit da34da... — fix do partial-match em getColumnValue).
--
-- O índice único parcial é a rede de segurança final contra duplicatas
-- futuras: bloqueia inserções com (legislation_id, description) repetidos
-- em evidências de import. Uploads manuais não são afetados.

BEGIN;

-- 1) Apaga as evidências de import da Gabardo.
DELETE FROM public.legislation_evidences
WHERE company_id = (
  SELECT p.company_id FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'jpbs@cesar.school'
  LIMIT 1
)
AND title = 'Evidência importada via planilha'
AND file_url IS NULL;

-- 2) Índice único parcial: bloqueia duplicatas em re-imports futuros.
--    Só alcança evidências geradas pelo import (file_url NULL e título
--    padrão). Uploads manuais ficam livres para descrições repetidas.
CREATE UNIQUE INDEX IF NOT EXISTS legislation_evidences_import_dedup_idx
ON public.legislation_evidences (legislation_id, description)
WHERE title = 'Evidência importada via planilha' AND file_url IS NULL;

COMMIT;
