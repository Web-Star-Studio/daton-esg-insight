-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS
-- ============================================

-- 1.3: Tornar conversation_id NOT NULL em chat_file_uploads
-- Primeiro, atualizar registros existentes sem conversation_id
UPDATE chat_file_uploads 
SET conversation_id = gen_random_uuid() 
WHERE conversation_id IS NULL;

-- Agora tornar a coluna NOT NULL
ALTER TABLE chat_file_uploads 
ALTER COLUMN conversation_id SET NOT NULL;

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_conversation_id 
ON chat_file_uploads(conversation_id);

-- ============================================
-- FASE 2: CORREÇÕES DE SEGURANÇA
-- ============================================

-- 2.2: Fixar Search Path das Funções (evitar SQL injection)
ALTER FUNCTION public.update_onboarding_selections_updated_at() 
SET search_path TO 'public';

ALTER FUNCTION public.update_license_observations_updated_at() 
SET search_path TO 'public';

ALTER FUNCTION public.update_license_comments_updated_at() 
SET search_path TO 'public';

-- 2.3: Restringir Acesso Público ao Marketplace
-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "Anyone can view active solutions" ON esg_solutions;
DROP POLICY IF EXISTS "Anyone can view reviews" ON solution_reviews;

-- Criar políticas seguras para usuários autenticados
CREATE POLICY "Authenticated users can view solutions" 
ON esg_solutions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can view reviews" 
ON solution_reviews FOR SELECT 
TO authenticated 
USING (true);

-- ============================================
-- VALIDAÇÕES E LOGS
-- ============================================

-- Comentário de auditoria
COMMENT ON TABLE chat_file_uploads IS 'Tabela de uploads de arquivos do chat - conversation_id obrigatório para integridade referencial';
COMMENT ON COLUMN chat_file_uploads.conversation_id IS 'ID da conversa (NOT NULL desde migração de segurança 2025-01-14)';