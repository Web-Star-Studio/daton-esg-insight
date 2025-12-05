-- Remover foreign keys duplicadas da tabela mentoring_relationships
-- Manter apenas as FKs padrão: mentoring_relationships_mentor_id_fkey e mentoring_relationships_mentee_id_fkey

ALTER TABLE public.mentoring_relationships 
  DROP CONSTRAINT IF EXISTS fk_mr_mentor;

ALTER TABLE public.mentoring_relationships 
  DROP CONSTRAINT IF EXISTS fk_mr_mentee;