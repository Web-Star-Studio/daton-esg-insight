
-- Promover felipe@webstar.studio a Platform Admin Master
DO $$
DECLARE
  v_user_id uuid := '2f291a48-938e-4c94-942d-b8cfeced6ad0';
  v_company_id uuid := 'fdd83760-60eb-445d-b711-6a0d61859925';
BEGIN
  -- Remover role admin antigo se existir
  DELETE FROM public.user_roles 
  WHERE user_id = v_user_id AND role = 'admin'::user_role_type;
  
  -- Adicionar role platform_admin
  INSERT INTO public.user_roles (
    user_id,
    role,
    company_id,
    assigned_by_user_id
  ) VALUES (
    v_user_id,
    'platform_admin'::user_role_type,
    v_company_id,
    v_user_id
  );
  
  -- Adicionar na tabela platform_admins (remover se existir primeiro)
  DELETE FROM public.platform_admins WHERE user_id = v_user_id;
  
  INSERT INTO public.platform_admins (
    user_id,
    full_name,
    email,
    permissions,
    is_active
  ) VALUES (
    v_user_id,
    'Felipe Guilherme - Platform Admin Master',
    'felipe@webstar.studio',
    '["manage_companies", "view_analytics", "manage_users", "system_admin", "super_admin"]'::jsonb,
    true
  );
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  ✓ PLATFORM ADMIN MASTER ATIVADO';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Email: felipe@webstar.studio';
  RAISE NOTICE 'Permissões: manage_companies, view_analytics, manage_users, system_admin, super_admin';
  RAISE NOTICE 'Status: Ativo';
  RAISE NOTICE '════════════════════════════════════════';
  
END $$;
