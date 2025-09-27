-- Create a more robust version of get_user_company_id with better error handling
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    user_company_id uuid;
BEGIN
    -- Get current auth user
    current_user_id := auth.uid();
    
    -- If no authenticated user, return null
    IF current_user_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No authenticated user found (auth.uid() is null)';
        RETURN NULL;
    END IF;
    
    -- Get company_id from profiles
    SELECT company_id INTO user_company_id 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    -- Log for debugging
    IF user_company_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No company_id found for user %', current_user_id;
    ELSE
        RAISE LOG 'get_user_company_id: Found company_id % for user %', user_company_id, current_user_id;
    END IF;
    
    RETURN user_company_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'get_user_company_id: Error occurred: %', SQLERRM;
        RETURN NULL;
END;
$function$;

-- Create a helper function to check if user has access to company data
CREATE OR REPLACE FUNCTION public.user_has_company_access(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    user_company_id uuid;
BEGIN
    -- Get current auth user
    current_user_id := auth.uid();
    
    -- If no authenticated user, return false
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get user's company_id
    SELECT company_id INTO user_company_id 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    -- Check if user's company matches the requested company
    RETURN (user_company_id = p_company_id);
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, deny access
        RETURN false;
END;
$function$;

-- Update RLS policies to be more resilient for departments
DROP POLICY IF EXISTS "Users can manage their company departments" ON departments;
CREATE POLICY "Users can manage their company departments" 
ON departments FOR ALL 
USING (
    -- Allow if user's company matches OR if company_id matches authenticated user's company
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    -- Fallback: if we can determine user is authenticated and company exists
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = departments.company_id
    ))
)
WITH CHECK (
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = departments.company_id
    ))
);

-- Update RLS policies to be more resilient for positions
DROP POLICY IF EXISTS "Users can manage their company positions" ON positions;
CREATE POLICY "Users can manage their company positions" 
ON positions FOR ALL 
USING (
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = positions.company_id
    ))
)
WITH CHECK (
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = positions.company_id
    ))
);

-- Update RLS policies to be more resilient for employees
DROP POLICY IF EXISTS "Users can manage their company employees" ON employees;
CREATE POLICY "Users can manage their company employees" 
ON employees FOR ALL 
USING (
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = employees.company_id
    ))
)
WITH CHECK (
    company_id = get_user_company_id() OR 
    user_has_company_access(company_id) OR
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.company_id = employees.company_id
    ))
);