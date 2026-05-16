-- F-023 da auditoria revisada (Lovable, 2026-05-16): bucket `audit-evidence`
-- estava `public=true` com policy SELECT `bucket_id = 'audit-evidence'` para
-- role `public` — qualquer URL gerada por getPublicUrl ficava acessível na
-- internet sem autenticação. INSERT/UPDATE/DELETE também não validavam o
-- folder pelo `audit_id` da company do caller.
--
-- Janela de oportunidade: bucket está vazio (0 objetos) e a tabela
-- audit_evidence também (0 registros), então a privatização + troca de
-- policies não tem regressão de dados.
--
-- Mudanças:
--   1. storage.buckets.audit-evidence: public=true → false. Force usar
--      signed URLs (app é refatorado em paralelo).
--   2. Drop 3 policies frouxas (SELECT/INSERT/DELETE).
--   3. Criar SELECT/INSERT/UPDATE/DELETE policies que checam que o folder
--      do path (storage.foldername(name)[1] = audit_id) pertence à
--      audits.company_id == get_user_company_id().
--   4. Adicionar coluna `file_path text` em audit_evidence: o app passa a
--      armazenar APENAS o path do storage (não a URL completa, que era
--      pública). Download é via createSignedUrl on-demand. Coluna file_url
--      mantida por compatibilidade (legado vazio).

BEGIN;

-- =============================================================================
-- 1) Privatizar o bucket
-- =============================================================================
UPDATE storage.buckets SET public = false WHERE name = 'audit-evidence';

-- =============================================================================
-- 2) Drop policies frouxas
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view audit evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audit evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own evidence" ON storage.objects;

-- =============================================================================
-- 3) Policies novas, escopadas pela company do audit
-- =============================================================================
-- Helper inline: o folder primário do path é o audit_id (uuid). Validamos que
-- esse audit pertence à company do caller via JOIN.
CREATE POLICY "audit_evidence_select_company"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audit-evidence'
    AND EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND a.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "audit_evidence_insert_company"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audit-evidence'
    AND EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND a.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "audit_evidence_update_company"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audit-evidence'
    AND EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND a.company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    bucket_id = 'audit-evidence'
    AND EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND a.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "audit_evidence_delete_company"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audit-evidence'
    AND EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = ((storage.foldername(name))[1])::uuid
        AND a.company_id = public.get_user_company_id()
    )
  );

-- =============================================================================
-- 4) Coluna file_path (path puro do storage). file_url fica como legado.
-- =============================================================================
ALTER TABLE public.audit_evidence
  ADD COLUMN IF NOT EXISTS file_path text;

COMMENT ON COLUMN public.audit_evidence.file_path IS
'Path do objeto em storage.objects (bucket audit-evidence). Use com createSignedUrl para baixar. file_url é legado e pode ser removido após migrar leituras existentes.';

COMMIT;
