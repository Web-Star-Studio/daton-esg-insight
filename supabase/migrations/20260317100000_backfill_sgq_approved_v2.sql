-- Corrige documentos SGQ que ficaram com is_approved=false após as migrations
-- de workflow de aprovação (20260313181045 e 20260313210000).
--
-- O backfill anterior (20260317000000) usava WHERE created_by_user_id IS NULL,
-- mas a migration 20260313210000 já preencheu esse campo com elaborated_by_user_id.
-- Resultado: zero rows eram atualizadas e os docs antigos continuavam invisíveis.
--
-- Esta migration marca como aprovados TODOS os documentos criados antes do
-- workflow de aprovação (antes de 2026-03-13), independente de created_by_user_id.
UPDATE public.sgq_iso_documents
SET is_approved = true
WHERE is_approved = false
  AND created_at < '2026-03-13T00:00:00Z';
