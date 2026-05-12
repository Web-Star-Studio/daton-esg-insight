-- CHECK constraint pra garantir coerência entre `scope` e `scope_company_id`
-- em watchdog_run_audit. Sem isso, era possível gravar 'global' com
-- scope_company_id setado, ou 'company' sem scope_company_id — estados
-- inconsistentes que confundem leitura no admin UI.

ALTER TABLE public.watchdog_run_audit
  ADD CONSTRAINT watchdog_run_audit_scope_coherence
  CHECK (
    (scope = 'global'  AND scope_company_id IS NULL) OR
    (scope = 'company' AND scope_company_id IS NOT NULL)
  );
