-- ============================================
-- FASE 1: Migração para Gerenciamento Avançado de Usuários
-- Adiciona campos para soft delete, status ativo e índices de unicidade
-- ============================================

-- 1. Adicionar campo de status ativo/inativo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Adicionar campos para soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID;

-- 3. Criar índice único para email (excluindo soft-deleted)
-- Nota: profiles.email pode não existir, vamos criar apenas o índice de username
DROP INDEX IF EXISTS idx_profiles_username_active;
CREATE UNIQUE INDEX idx_profiles_username_active 
  ON profiles(username) 
  WHERE username IS NOT NULL AND deleted_at IS NULL;

-- 4. Índice para busca full-text em português
DROP INDEX IF EXISTS idx_profiles_search;
CREATE INDEX idx_profiles_search 
  ON profiles USING gin(
    to_tsvector('portuguese', 
      COALESCE(full_name, '') || ' ' || COALESCE(username, '')
    )
  );

-- 5. Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
  ON profiles(is_active) 
  WHERE is_active = true;

-- 6. Índice para soft delete
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at 
  ON profiles(deleted_at) 
  WHERE deleted_at IS NOT NULL;