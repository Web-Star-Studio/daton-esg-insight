-- Reset das evidências geradas pelo import — etapa 1 de 2: Fike.
--
-- Contexto: antes do commit 50732397 (2026-04-22), cada re-importação criava
-- uma nova linha em legislation_evidences mesmo quando (legislation_id,
-- description) já existia. Resultado: 2.299 linhas geradas pelo import na
-- Fike, com até 8 cópias do mesmo registro por legislação.
--
-- Estratégia: apagar as evidências de import da Fike e refazer o import
-- a partir da planilha — assim o conteúdo passa a refletir 1:1 o arquivo,
-- sem lixo histórico. Uploads manuais (qualquer linha com file_url ou com
-- título diferente do padrão de import) NÃO são afetados.
--
-- Próxima etapa (após validação na Fike): aplicar o mesmo reset à Transportes
-- Gabardo e criar o índice único parcial em legislation_evidences que serve
-- de rede de segurança contra duplicatas futuras.

BEGIN;

DELETE FROM public.legislation_evidences
WHERE company_id = (SELECT id FROM public.companies WHERE name = 'Fike' LIMIT 1)
  AND title = 'Evidência importada via planilha'
  AND file_url IS NULL;

COMMIT;
