-- Migrate profiles table to use new role system
-- First, add a temporary column with the new type
ALTER TABLE public.profiles 
ADD COLUMN new_role user_role_type;

-- Map old roles to new roles
UPDATE public.profiles
SET new_role = CASE 
  WHEN role::text = 'Admin' THEN 'admin'::user_role_type
  WHEN role::text = 'Editor' THEN 'manager'::user_role_type
  WHEN role::text = 'Leitor' THEN 'viewer'::user_role_type
  ELSE 'operator'::user_role_type
END;

-- Drop old role column and rename new one
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;

-- Set default value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'viewer'::user_role_type;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;