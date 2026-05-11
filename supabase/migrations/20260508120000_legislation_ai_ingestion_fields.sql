-- Marca legislações que entraram no catálogo via radar Perplexity (não
-- validadas por humano). O radar mensal popula esses campos quando o
-- usuário aceita uma novidade na página de Sugestões. O trigger
-- `create_legislation_history` continua disparando normalmente — a
-- novidade aceita aparece como `action='created'` na carta do mês.

ALTER TABLE public.legislations
  ADD COLUMN IF NOT EXISTS ai_ingested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_source_url text,
  ADD COLUMN IF NOT EXISTS ai_ingestion_meta jsonb;

CREATE INDEX IF NOT EXISTS legislations_ai_ingested_idx
  ON public.legislations (ai_ingested) WHERE ai_ingested = true;

COMMENT ON COLUMN public.legislations.ai_ingested IS
  'true quando a norma foi importada via radar Perplexity (não validada por humano).';
COMMENT ON COLUMN public.legislations.ai_source_url IS
  'URL canônica (DOU, planalto, portal estadual) registrada pela IA na ingestão.';
COMMENT ON COLUMN public.legislations.ai_ingestion_meta IS
  'JSON livre com metadata da ingestão IA: timestamp, prompt_version, applicability_hint, matched_themes, citations.';
