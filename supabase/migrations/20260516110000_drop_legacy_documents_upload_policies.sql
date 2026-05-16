-- F-020 follow-up — drop policies INSERT permissivas do bucket `documents`
--
-- Lovable (re-auditoria 2026-05-16) confirmou que duas policies legacy
-- coexistem com as policies tenant-scoped corretas. Em PostgreSQL RLS,
-- policies são avaliadas por OR — então a permissiva sempre vence e
-- anula o ganho dos PRs #84-#86-#89.
--
-- Policies INSERT que ficam (após este DROP) cobrem 100% dos call sites
-- já refatorados pra ter company_id no nível 1 do path:
--
--   - "Company users can upload employee documents to company folders"
--     foldername(name)[1]::uuid IN profiles.company_id WHERE id = auth.uid()
--     → cobre paths:
--         ${company_id}/general/...           (documents.ts, documentCenter.ts)
--         ${company_id}/licenses/...          (licenses.ts)
--         ${company_id}/_temp/...             (licenses.ts:analyzeLicenseDocument)
--         ${company_id}/waste-logs/...        (waste.ts)
--         ${company_id}/mtr-documents/...     (mtrDocuments.ts)
--         ${company_id}/audit-attachments/... (AttachmentManager.tsx)
--         ${company_id}/employees/...         (employeeDocuments.ts)
--         ${company_id}/training-documents/...(trainingDocuments.ts, PR #89)
--         ${company_id}/supplier-documents/...(SupplierDocumentEvaluationPage, PR #89)
--
--   - "Users can upload their company documents"
--     auth.uid()::text = foldername(name)[1]
--     → cobre paths ${user_id}/... se algum caller usar (legacy mas válida).
--
-- Policies INSERT que dropam:
--
--   - "Authenticated users can upload documents"
--     with_check: (bucket_id = 'documents') AND (auth.uid() IS NOT NULL)
--     → qualquer authenticated em qualquer path. Anulava as outras por OR.
--
--   - "Users can upload documents to their company"
--     with_check: (bucket_id = 'documents') AND (auth.uid() IN (SELECT id FROM profiles))
--     → qualquer authenticated com profile, em qualquer path. Idem.
--
-- Impacto em LEITURA: ZERO. As 4 policies SELECT do bucket continuam
-- intactas. Arquivos existentes seguem 100% visualizáveis.
-- Impacto em UPDATE/DELETE: ZERO. Policies separadas.

BEGIN;

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents to their company" ON storage.objects;

COMMIT;
