INSERT INTO public.sgq_document_versions (
  sgq_document_id, company_id, version_number, changes_summary,
  elaborated_by_user_id, approved_by_user_id, approved_at, attachment_document_id
)
SELECT
  d.id,
  d.company_id,
  1,
  'Versão inicial',
  d.elaborated_by_user_id,
  d.approved_by_user_id,
  COALESCE(d.approved_at, d.created_at),
  (SELECT doc.id FROM public.documents doc
   WHERE doc.related_model = 'sgq_iso_document' AND doc.related_id = d.id
   ORDER BY doc.upload_date ASC LIMIT 1)
FROM public.sgq_iso_documents d
WHERE NOT EXISTS (
  SELECT 1 FROM public.sgq_document_versions v
  WHERE v.sgq_document_id = d.id AND v.version_number = 1
);