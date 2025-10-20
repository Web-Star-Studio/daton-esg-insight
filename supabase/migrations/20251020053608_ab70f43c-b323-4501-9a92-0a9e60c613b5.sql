-- Fix infinite recursion in user_roles RLS policies (v2)
-- Drop conflicting policies then recreate safe versions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Super admins can view all roles'
  ) THEN
    DROP POLICY "Super admins can view all roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can view company roles'
  ) THEN
    DROP POLICY "Admins can view company roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Super admins can manage all roles'
  ) THEN
    DROP POLICY "Super admins can manage all roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can manage company roles'
  ) THEN
    DROP POLICY "Admins can manage company roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins/SuperAdmins can view company roles'
  ) THEN
    DROP POLICY "Admins/SuperAdmins can view company roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Super admins can manage roles'
  ) THEN
    DROP POLICY "Super admins can manage roles" ON public.user_roles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can manage company roles (no super_admin)'
  ) THEN
    DROP POLICY "Admins can manage company roles (no super_admin)" ON public.user_roles;
  END IF;
END $$;

-- Recreate safe, non-recursive policies
CREATE POLICY "Admins/SuperAdmins can view company roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR (
    public.has_role(auth.uid(), 'admin')
    AND company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage company roles (no super_admin)"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  AND company_id = public.get_user_company_id()
  AND role != 'super_admin'
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND company_id = public.get_user_company_id()
  AND role != 'super_admin'
);

COMMENT ON POLICY "Admins/SuperAdmins can view company roles" ON public.user_roles IS 'Uses SECURITY DEFINER functions to avoid recursive RLS references.';
COMMENT ON POLICY "Super admins can manage roles" ON public.user_roles IS 'Service-level management by super admins.';
COMMENT ON POLICY "Admins can manage company roles (no super_admin)" ON public.user_roles IS 'Admins limited to their company and cannot assign super_admin.';