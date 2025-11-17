-- ============================================
-- FASE 1: INFRAESTRUTURA PLATFORM ADMIN
-- ============================================

-- 1. Adicionar novo valor ao enum user_role_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'platform_admin' 
    AND enumtypid = 'user_role_type'::regtype
  ) THEN
    ALTER TYPE user_role_type ADD VALUE 'platform_admin';
  END IF;
END $$;

-- 2. Criar tabela platform_admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  permissions jsonb DEFAULT '{"all": true}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id),
  last_login_at timestamptz,
  notes text
);

-- Índices para platform_admins
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON public.platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON public.platform_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON public.platform_admins(email);

-- RLS para platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;
CREATE POLICY "Platform admins can view all platform admins"
  ON public.platform_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

DROP POLICY IF EXISTS "Platform admins can update themselves" ON public.platform_admins;
CREATE POLICY "Platform admins can update themselves"
  ON public.platform_admins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Criar tabela platform_admin_actions (auditoria)
CREATE TABLE IF NOT EXISTS public.platform_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  action_type text NOT NULL,
  target_company_id uuid REFERENCES public.companies(id),
  target_user_id uuid REFERENCES auth.users(id),
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para platform_admin_actions
CREATE INDEX IF NOT EXISTS idx_platform_actions_admin ON public.platform_admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_actions_company ON public.platform_admin_actions(target_company_id);
CREATE INDEX IF NOT EXISTS idx_platform_actions_created ON public.platform_admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_actions_type ON public.platform_admin_actions(action_type);

-- RLS para platform_admin_actions
ALTER TABLE public.platform_admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view audit logs" ON public.platform_admin_actions;
CREATE POLICY "Platform admins can view audit logs"
  ON public.platform_admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

DROP POLICY IF EXISTS "Platform admins can insert audit logs" ON public.platform_admin_actions;
CREATE POLICY "Platform admins can insert audit logs"
  ON public.platform_admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

-- 4. Criar função helper is_platform_admin()
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- 5. Atualizar RLS das tabelas críticas para permitir acesso de Platform Admin

-- 5.1 Companies - Platform admin pode ver e editar todas
DROP POLICY IF EXISTS "Platform admins can view all companies" ON public.companies;
CREATE POLICY "Platform admins can view all companies"
  ON public.companies FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update companies" ON public.companies;
CREATE POLICY "Platform admins can update companies"
  ON public.companies FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert companies" ON public.companies;
CREATE POLICY "Platform admins can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (public.is_platform_admin());

-- 5.2 Profiles - Platform admin pode ver todos os perfis
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;
CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update all profiles" ON public.profiles;
CREATE POLICY "Platform admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- 5.3 User Roles - Platform admin pode ver e gerenciar todas as roles
DROP POLICY IF EXISTS "Platform admins can view all user roles" ON public.user_roles;
CREATE POLICY "Platform admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update user roles" ON public.user_roles;
CREATE POLICY "Platform admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert user roles" ON public.user_roles;
CREATE POLICY "Platform admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can delete user roles" ON public.user_roles;
CREATE POLICY "Platform admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (public.is_platform_admin());

-- 5.4 Activity Logs - Platform admin pode ver todos os logs
DROP POLICY IF EXISTS "Platform admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Platform admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_platform_admin());

-- 6. Função helper para registrar ações de platform admin
CREATE OR REPLACE FUNCTION public.log_platform_admin_action(
  p_action_type text,
  p_target_company_id uuid DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  -- Verificar se é platform admin
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform admins can perform this action';
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO public.platform_admin_actions (
    admin_user_id,
    action_type,
    target_company_id,
    target_user_id,
    details
  )
  VALUES (
    auth.uid(),
    p_action_type,
    p_target_company_id,
    p_target_user_id,
    p_details
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

-- 7. Atualizar a última vez que platform admin fez login
CREATE OR REPLACE FUNCTION public.update_platform_admin_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_admins
  SET last_login_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar last_login_at quando há nova sessão
DROP TRIGGER IF EXISTS on_platform_admin_login ON auth.users;
CREATE TRIGGER on_platform_admin_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_platform_admin_last_login();

-- 8. Comentários nas tabelas
COMMENT ON TABLE public.platform_admins IS 'Administradores da plataforma Daton com acesso total ao sistema';
COMMENT ON TABLE public.platform_admin_actions IS 'Log de auditoria de todas as ações realizadas por platform admins';
COMMENT ON FUNCTION public.is_platform_admin() IS 'Verifica se o usuário atual é um platform admin ativo';
COMMENT ON FUNCTION public.log_platform_admin_action(text, uuid, uuid, jsonb) IS 'Registra uma ação de platform admin no log de auditoria';