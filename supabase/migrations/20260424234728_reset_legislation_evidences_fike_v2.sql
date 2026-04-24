-- Reset das evidências de import — Fike (correção da migration anterior).
--
-- A migration 20260424203303 usou `WHERE name = 'Fike' LIMIT 1` para
-- localizar a empresa, mas existem 5 empresas com esse nome no banco
-- (provavelmente sandboxes), e o LIMIT pegou a primeira por ordem
-- arbitrária — uma Fike vazia. A Fike alvo (do usuário joaopedrobatista010,
-- com 2.299 evidências de import) ficou intacta.
--
-- Aqui usamos o mesmo padrão da migration 20260420212623: lookup pelo
-- email do usuário, que resolve direto para o company_id correto.

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
