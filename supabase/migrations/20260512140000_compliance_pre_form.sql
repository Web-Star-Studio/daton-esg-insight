-- Pre-compliance triage: armazena respostas de um questionário curto que
-- determina o escopo da unidade (ex: infra do cliente, condomínio, só admin)
-- e produz uma lista achatada de temas/perguntas suprimidos. O questionário
-- principal lê suppressed_keys para esconder partes irrelevantes e excluí-las
-- do progresso e da geração de tags.
--
-- O mapeamento entre pre_responses e suppressed_keys é mantido em
-- src/components/legislation/compliance-questionnaire/suppressionRules.ts.
-- O banco apenas armazena o resultado computado pelo cliente — não há
-- lógica server-side.
--
-- Backwards compat: defaults vazios garantem comportamento idêntico ao
-- atual para todas as linhas pré-existentes. Nenhum backfill é necessário.

ALTER TABLE public.legislation_compliance_profiles
  ADD COLUMN IF NOT EXISTS pre_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS suppressed_keys TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.legislation_compliance_profiles.pre_responses IS
  'Respostas do pré-questionário de triagem (escopo da unidade): { [preQuestionId]: string | string[] }. IDs definidos em src/components/legislation/compliance-questionnaire/preQuestions.config.ts.';

COMMENT ON COLUMN public.legislation_compliance_profiles.suppressed_keys IS
  'Lista achatada de temas/perguntas fora do escopo da unidade. Formato: "theme:<themeId>" ou "q:<questionId>". Derivado de pre_responses via suppressionRules.ts (cliente). Usado pelo questionário principal para ocultar conteúdo e pelo generateTagsFromResponses para excluir tags suprimidas.';
