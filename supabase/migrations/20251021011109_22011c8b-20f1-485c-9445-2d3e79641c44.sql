-- Add RLS policies for profiles and user_roles to allow users to read their own data

-- Policy for profiles: users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Policy for user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Optional: Allow reading companies that the user belongs to
CREATE POLICY "Users can read own company" 
ON public.companies 
FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);