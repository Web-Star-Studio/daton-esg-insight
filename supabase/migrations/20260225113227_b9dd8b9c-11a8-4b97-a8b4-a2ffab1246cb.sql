
CREATE TABLE public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, module_key)
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role within same company
CREATE OR REPLACE FUNCTION public.can_manage_user_modules(_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    JOIN public.profiles target_p ON target_p.id = _target_user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'platform_admin')
      AND p.company_id = target_p.company_id
  )
$$;

-- Admins can manage module access for users in their company
CREATE POLICY "Admins can manage module access"
  ON public.user_module_access
  FOR ALL
  TO authenticated
  USING (public.can_manage_user_modules(user_id))
  WITH CHECK (public.can_manage_user_modules(user_id));

-- Users can read their own access
CREATE POLICY "Users can read own module access"
  ON public.user_module_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
