-- Security definer function to check roles (prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role_type)
RETURNS boolean
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
  )
$$;

-- Fix search_path on existing functions to prevent security warnings
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;