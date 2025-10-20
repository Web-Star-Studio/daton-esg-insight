-- ============================================
-- CRITICAL SECURITY FIX: Secure Role System
-- ============================================
-- This migration fixes the privilege escalation vulnerability
-- by moving roles from profiles table to a dedicated user_roles table
-- with SECURITY DEFINER functions for safe role checks

-- 1. Create user_roles table (roles separate from profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 5. Create function to get user's role (returns first role found)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- 6. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
SELECT 
    p.id,
    p.role,
    p.company_id,
    p.id -- Self-assigned for migration
FROM public.profiles p
WHERE p.role IS NOT NULL
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
  );

-- 7. Create RLS policies for user_roles table

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Admins can view roles in their company
CREATE POLICY "Admins can view company roles"
ON public.user_roles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Admins can manage roles in their company (but not super_admin role)
CREATE POLICY "Admins can manage company roles"
ON public.user_roles
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
  AND role != 'super_admin' -- Admins cannot create super_admins
);

-- 8. Update user_has_permission function to use user_roles table
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role_type;
  has_permission BOOLEAN := false;
  custom_permission_exists BOOLEAN;
  custom_permission_granted BOOLEAN;
BEGIN
  -- Get user's role from user_roles table (SECURE)
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
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
$$;

-- 9. Add helpful comment
COMMENT ON TABLE public.user_roles IS 'Secure role storage - roles are isolated from user-modifiable data to prevent privilege escalation';
COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER function to check user roles without RLS recursion issues';
COMMENT ON FUNCTION public.get_user_role IS 'SECURITY DEFINER function to retrieve user role safely';