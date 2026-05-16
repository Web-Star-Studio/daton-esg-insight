-- F-021 da auditoria revisada (Lovable, 2026-05-16): bucket `nc-evidence`
-- estava `public=true` com policy SELECT `bucket_id='nc-evidence'` para o
-- role public — qualquer URL gerada por getPublicUrl ficava acessível na
-- internet sem autenticação. As policies INSERT/UPDATE/DELETE só checavam
-- `auth.role()='authenticated'` sem validar folder/empresa.
--
-- Estado em prod: 1 objeto único, e ele é órfão (a non_conformity com
-- id=fb96b902-b313-480e-88d4-cbc20e8b8e8a foi deletada). Sem regressão de
-- dados em uso.
--
-- App (NCStage5Implementation.tsx:78) usa path `${ncId}/${planId}/<file>` —
-- primeiro folder é o nc_id. JOIN com non_conformities valida a empresa.

BEGIN;

-- 1) Privatizar
UPDATE storage.buckets SET public = false WHERE name = 'nc-evidence';

-- 2) Drop policies frouxas
DROP POLICY IF EXISTS "Users can view nc evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload nc evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their nc evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their nc evidence files" ON storage.objects;

-- 3) Policies novas, escopadas pela company da NC
CREATE POLICY "nc_evidence_select_company"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'nc-evidence'
    AND EXISTS (
      SELECT 1 FROM public.non_conformities n
      WHERE n.id = ((storage.foldername(name))[1])::uuid
        AND n.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "nc_evidence_insert_company"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nc-evidence'
    AND EXISTS (
      SELECT 1 FROM public.non_conformities n
      WHERE n.id = ((storage.foldername(name))[1])::uuid
        AND n.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "nc_evidence_update_company"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'nc-evidence'
    AND EXISTS (
      SELECT 1 FROM public.non_conformities n
      WHERE n.id = ((storage.foldername(name))[1])::uuid
        AND n.company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    bucket_id = 'nc-evidence'
    AND EXISTS (
      SELECT 1 FROM public.non_conformities n
      WHERE n.id = ((storage.foldername(name))[1])::uuid
        AND n.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "nc_evidence_delete_company"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'nc-evidence'
    AND EXISTS (
      SELECT 1 FROM public.non_conformities n
      WHERE n.id = ((storage.foldername(name))[1])::uuid
        AND n.company_id = public.get_user_company_id()
    )
  );

COMMIT;
