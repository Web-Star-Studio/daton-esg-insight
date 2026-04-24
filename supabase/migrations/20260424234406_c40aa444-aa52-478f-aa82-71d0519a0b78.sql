BEGIN;

DELETE FROM public.legislation_evidences
WHERE company_id = (SELECT id FROM public.companies WHERE name = 'Fike' LIMIT 1)
  AND title = 'Evidência importada via planilha'
  AND file_url IS NULL;

COMMIT;