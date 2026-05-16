-- F-022 da auditoria revisada: bucket `reports` tinha duas policies frouxas
-- (`auth_can_read_reports` e `auth_can_upload_reports`) que checavam apenas
-- `bucket_id='reports'` sem escopo por empresa. Qualquer authenticated lia
-- ou subia em qualquer pasta.
--
-- Estrutura atual dos paths (4 objetos em prod, todos em
-- `reports/licenses/<license_id>/<file>`): primeiro folder é literal
-- "reports", segundo "licenses", terceiro é o license_id. App
-- (licenseReports.ts:218) gera o path com esse formato; download já usa
-- createSignedUrl (bucket é public=false).
--
-- Fix:
--   1. Drop as 4 policies existentes (2 frouxas + 2 que esperavam
--      `(storage.foldername(name))[1] = company_id` — nunca casaram com
--      a estrutura atual e estavam mortas).
--   2. Criar 4 novas (SELECT/INSERT/UPDATE/DELETE) que validam:
--        bucket_id='reports'
--        AND foldername[1]='reports' AND foldername[2]='licenses'
--        AND licenses.id = foldername[3]::uuid
--        AND licenses.company_id = get_user_company_id()

BEGIN;

DROP POLICY IF EXISTS "auth_can_read_reports" ON storage.objects;
DROP POLICY IF EXISTS "auth_can_upload_reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their company reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload reports for their company" ON storage.objects;

CREATE POLICY "reports_select_company"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = 'reports'
    AND (storage.foldername(name))[2] = 'licenses'
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = ((storage.foldername(name))[3])::uuid
        AND l.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "reports_insert_company"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = 'reports'
    AND (storage.foldername(name))[2] = 'licenses'
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = ((storage.foldername(name))[3])::uuid
        AND l.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "reports_update_company"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = 'reports'
    AND (storage.foldername(name))[2] = 'licenses'
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = ((storage.foldername(name))[3])::uuid
        AND l.company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = 'reports'
    AND (storage.foldername(name))[2] = 'licenses'
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = ((storage.foldername(name))[3])::uuid
        AND l.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "reports_delete_company"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = 'reports'
    AND (storage.foldername(name))[2] = 'licenses'
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = ((storage.foldername(name))[3])::uuid
        AND l.company_id = public.get_user_company_id()
    )
  );

COMMIT;
