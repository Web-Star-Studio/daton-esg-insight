-- Promover usuário existente a Platform Admin
-- Este script deve ser executado DEPOIS do usuário fazer signup na interface
-- Email: felipe@webstar.studio

DO $$
DECLARE
  v_user_id uuid;
  v_user_exists boolean;
BEGIN
  -- Verificar se o usuário existe no auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'felipe@webstar.studio'
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠ Usuário felipe@webstar.studio ainda não existe no sistema';
    RAISE NOTICE '→ Por favor, faça o signup primeiro através da interface de login';
    RAISE NOTICE '→ Email: felipe@webstar.studio';
    RAISE NOTICE '→ Senha: Daton25@123';
    RAISE NOTICE '→ Depois execute esta migration novamente';
    RETURN;
  END IF;
  
  RAISE NOTICE '✓ Usuário encontrado: %', v_user_id;
  
  -- Atualizar ou criar profile
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Felipe Guilherme - Platform Admin',
    'felipe@webstar.studio',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE 
  SET full_name = COALESCE(NULLIF(profiles.full_name, ''), 'Felipe Guilherme - Platform Admin'),
      email = 'felipe@webstar.studio',
      updated_at = now();
  
  RAISE NOTICE '✓ Profile atualizado';
  
  -- Criar ou atualizar role de platform_admin
  INSERT INTO public.user_roles (
    user_id,
    role,
    assigned_by_user_id,
    created_at
  ) VALUES (
    v_user_id,
    'platform_admin'::user_role_type,
    v_user_id,
    now()
  )
  ON CONFLICT (user_id, role) DO UPDATE
  SET updated_at = now();
  
  RAISE NOTICE '✓ Role platform_admin atribuída';
  
  -- Adicionar ou atualizar na tabela platform_admins
  INSERT INTO public.platform_admins (
    user_id,
    full_name,
    email,
    permissions,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Felipe Guilherme - Platform Admin',
    'felipe@webstar.studio',
    '["manage_companies", "view_analytics", "manage_users", "system_admin"]'::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE 
  SET full_name = 'Felipe Guilherme - Platform Admin',
      email = 'felipe@webstar.studio',
      permissions = '["manage_companies", "view_analytics", "manage_users", "system_admin"]'::jsonb,
      is_active = true,
      updated_at = now();
  
  RAISE NOTICE '✓ Platform Admin configurado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  PLATFORM ADMIN MASTER ATIVADO';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Email: felipe@webstar.studio';
  RAISE NOTICE 'Permissões: manage_companies, view_analytics, manage_users, system_admin';
  RAISE NOTICE 'Status: Ativo';
  RAISE NOTICE '════════════════════════════════════════';
  
END $$;