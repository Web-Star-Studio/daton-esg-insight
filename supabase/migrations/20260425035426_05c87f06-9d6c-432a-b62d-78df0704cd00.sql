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