-- Limpeza das 48 evidências spurious geradas pelo bug do partial-match
-- em getColumnValue (legislationImport.ts). Quando a coluna "EVIDÊNCIA DE
-- ATENDIMENTO" estava vazia em uma linha da planilha, o fallback de
-- partial-match casava com a coluna "ATENDIMENTO" porque a string
-- 'evidenciadeatendimento' contém 'atendimento'. Resultado: o valor da
-- coluna ATENDIMENTO ('N.A', 'CONFORME', 'ADEQUAÇÃO') virava evidência.
--
-- Correção do código: getColumnValue agora só aceita partial-match na
-- direção "header da planilha contém a busca", não a inversa.
--
-- Distribuição das 48 spurious confirmadas (Fike) — verificadas por
-- reconciliação contra as planilhas federais.xlsx, internacional.xlsx
-- e nbr.xlsx (zero linhas legítimas com esses textos na coluna correta):
--   federal:        22 'N.A' + 1 'CONFORME'                    = 23
--   internacional:   5 'N.A' + 2 'CONFORME'                    =  7
--   nbr:             2 'N.A' + 16 'ADEQUAÇÃO'                  = 18
--   total                                                       = 48

BEGIN;

DELETE FROM public.legislation_evidences
WHERE company_id = (
  SELECT p.company_id FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'joaopedrobatista010@gmail.com'
  LIMIT 1
)
AND title = 'Evidência importada via planilha'
AND file_url IS NULL
AND description IN ('N.A', 'CONFORME', 'ADEQUAÇÃO');

COMMIT;
