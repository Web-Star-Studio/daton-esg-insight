-- Create user_roles enum with all permission levels
CREATE TYPE user_role_type AS ENUM (
  'super_admin',      -- Full system access
  'admin',            -- Company admin
  'manager',          -- Department manager  
  'analyst',          -- Data analyst
  'operator',         -- Data entry
  'viewer',           -- Read-only
  'auditor'          -- Audit access
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'emissions', 'goals', 'reports', 'admin', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Create user_custom_permissions for granular overrides
CREATE TABLE IF NOT EXISTS public.user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true, -- true = grant, false = revoke
  granted_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Create audit trail for permission changes
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  action VARCHAR(50) NOT NULL, -- 'role_changed', 'permission_granted', 'permission_revoked'
  target_user_id UUID REFERENCES auth.users(id),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default permissions
INSERT INTO public.permissions (code, name, description, category) VALUES
-- Emissions Management
('emissions.view', 'Visualizar Emissões', 'Ver dados de emissões e inventário GEE', 'emissions'),
('emissions.create', 'Criar Emissões', 'Cadastrar novos dados de emissões', 'emissions'),
('emissions.edit', 'Editar Emissões', 'Modificar dados de emissões existentes', 'emissions'),
('emissions.delete', 'Excluir Emissões', 'Remover registros de emissões', 'emissions'),
('emissions.approve', 'Aprovar Emissões', 'Aprovar dados de emissões para publicação', 'emissions'),

-- Goals & Targets
('goals.view', 'Visualizar Metas', 'Ver metas ESG e progresso', 'goals'),
('goals.create', 'Criar Metas', 'Cadastrar novas metas', 'goals'),
('goals.edit', 'Editar Metas', 'Modificar metas existentes', 'goals'),
('goals.delete', 'Excluir Metas', 'Remover metas', 'goals'),

-- Reports & Documents
('reports.view', 'Visualizar Relatórios', 'Ver relatórios e documentos', 'reports'),
('reports.create', 'Criar Relatórios', 'Gerar novos relatórios', 'reports'),
('reports.edit', 'Editar Relatórios', 'Modificar relatórios', 'reports'),
('reports.publish', 'Publicar Relatórios', 'Publicar relatórios oficiais', 'reports'),
('reports.export', 'Exportar Relatórios', 'Exportar dados e relatórios', 'reports'),

-- Risks & Compliance
('risks.view', 'Visualizar Riscos', 'Ver riscos e não-conformidades', 'risks'),
('risks.create', 'Criar Riscos', 'Cadastrar riscos', 'risks'),
('risks.edit', 'Editar Riscos', 'Modificar riscos', 'risks'),
('risks.delete', 'Excluir Riscos', 'Remover riscos', 'risks'),

-- User & Company Management
('users.view', 'Visualizar Usuários', 'Ver lista de usuários', 'admin'),
('users.create', 'Criar Usuários', 'Adicionar novos usuários', 'admin'),
('users.edit', 'Editar Usuários', 'Modificar dados de usuários', 'admin'),
('users.delete', 'Excluir Usuários', 'Remover usuários', 'admin'),
('users.manage_permissions', 'Gerenciar Permissões', 'Alterar permissões de usuários', 'admin'),

-- Company Settings
('company.view', 'Visualizar Empresa', 'Ver dados da empresa', 'admin'),
('company.edit', 'Editar Empresa', 'Modificar configurações da empresa', 'admin'),
('company.billing', 'Gerenciar Faturamento', 'Acessar informações de cobrança', 'admin'),

-- Analytics & AI
('analytics.view', 'Visualizar Analytics', 'Ver dashboards e análises preditivas', 'analytics'),
('analytics.advanced', 'Analytics Avançado', 'Acessar análises preditivas e IA', 'analytics'),

-- Audit
('audit.view', 'Visualizar Auditoria', 'Ver logs de auditoria', 'audit'),
('audit.export', 'Exportar Auditoria', 'Exportar logs de auditoria', 'audit')
ON CONFLICT (code) DO NOTHING;

-- Assign default permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions 
WHERE category IN ('emissions', 'goals', 'reports', 'risks', 'admin', 'analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager', id FROM public.permissions 
WHERE code IN (
  'emissions.view', 'emissions.create', 'emissions.edit',
  'goals.view', 'goals.create', 'goals.edit',
  'reports.view', 'reports.create', 'reports.edit',
  'risks.view', 'risks.create', 'risks.edit',
  'analytics.view', 'users.view'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'analyst', id FROM public.permissions 
WHERE code IN (
  'emissions.view', 'emissions.create',
  'goals.view',
  'reports.view', 'reports.create',
  'risks.view',
  'analytics.view', 'analytics.advanced'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'operator', id FROM public.permissions 
WHERE code IN (
  'emissions.view', 'emissions.create',
  'goals.view',
  'reports.view',
  'risks.view'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer', id FROM public.permissions 
WHERE code LIKE '%.view'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'auditor', id FROM public.permissions 
WHERE code LIKE '%.view' OR category = 'audit'
ON CONFLICT DO NOTHING;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role_type;
  has_permission BOOLEAN := false;
  custom_permission_exists BOOLEAN;
  custom_permission_granted BOOLEAN;
BEGIN
  -- Get user's role from profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Super admin has all permissions
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Check if user has custom permission override
  SELECT EXISTS(
    SELECT 1 FROM public.user_custom_permissions ucp
    JOIN public.permissions p ON ucp.permission_id = p.id
    WHERE ucp.user_id = p_user_id AND p.code = p_permission_code
  ) INTO custom_permission_exists;
  
  IF custom_permission_exists THEN
    SELECT granted INTO custom_permission_granted
    FROM public.user_custom_permissions ucp
    JOIN public.permissions p ON ucp.permission_id = p.id
    WHERE ucp.user_id = p_user_id AND p.code = p_permission_code;
    
    RETURN custom_permission_granted;
  END IF;
  
  -- Check role-based permission
  SELECT EXISTS(
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role AND p.code = p_permission_code
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log permission changes
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_log (
      user_id,
      company_id,
      action,
      target_user_id,
      new_value
    )
    SELECT 
      COALESCE(NEW.granted_by_user_id, auth.uid()),
      p.company_id,
      CASE WHEN NEW.granted THEN 'permission_granted' ELSE 'permission_revoked' END,
      NEW.user_id,
      to_jsonb(NEW)
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for permission audit
CREATE TRIGGER trigger_log_permission_change
AFTER INSERT OR UPDATE ON public.user_custom_permissions
FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();

-- Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view custom permissions in their company"
ON public.user_custom_permissions FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

CREATE POLICY "Admins can manage custom permissions"
ON public.user_custom_permissions FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id() AND
  user_has_permission(auth.uid(), 'users.manage_permissions')
);

CREATE POLICY "Users can view audit logs from their company"
ON public.permission_audit_log FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id() AND
  user_has_permission(auth.uid(), 'audit.view')
);