-- Corrigir políticas RLS para platform_admins (remover lógica circular)

-- Remover política problemática
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;

-- Manter apenas as políticas simples e funcionais:
-- 1. Usuários autenticados podem ver seu próprio status (já existe)
-- 2. Service role tem acesso total (já existe)

-- Adicionar log de confirmação
DO $$
BEGIN
  RAISE NOTICE '✓ Política circular removida';
  RAISE NOTICE '✓ Mantidas apenas políticas simples para platform_admins';
  RAISE NOTICE '✓ Usuários autenticados podem ver seu próprio registro';
END $$;