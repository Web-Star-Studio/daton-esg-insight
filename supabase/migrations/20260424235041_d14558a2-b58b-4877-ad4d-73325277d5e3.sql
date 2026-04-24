BEGIN;

DELETE FROM public.legislation_evidences
WHERE company_id = (
  SELECT p.company_id FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'joaopedrobatista010@gmail.com'
  LIMIT 1
)
AND title = 'Evidência importada via planilha'
AND file_url IS NULL;

COMMIT;