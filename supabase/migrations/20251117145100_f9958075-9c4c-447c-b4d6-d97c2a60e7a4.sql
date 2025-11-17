
-- Adicionar políticas RLS para platform_admins
-- Primeiro garantir que RLS está habilitado
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own platform admin status" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Service role has full access to platform admins" ON public.platform_admins;

-- Política para permitir que usuários autenticados vejam seu próprio registro
CREATE POLICY "Users can view their own platform admin status"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para permitir que platform admins vejam todos os registros
CREATE POLICY "Platform admins can view all platform admins"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid()
    AND pa.is_active = true
  )
);

-- Política para service role ter acesso total (crítico para edge functions)
CREATE POLICY "Service role has full access to platform admins"
ON public.platform_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS criadas com sucesso para platform_admins';
  RAISE NOTICE '✓ Edge functions agora podem verificar status de platform admin';
END $$;
