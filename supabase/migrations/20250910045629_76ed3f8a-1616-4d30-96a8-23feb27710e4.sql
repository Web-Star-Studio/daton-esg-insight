-- Fix RLS policies for companies table to allow registration
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

-- Create new policies that work with registration flow
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (id = get_user_company_id());

CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (id = get_user_company_id());

-- Allow company creation during registration (public insert)
CREATE POLICY "Allow company creation during registration" 
ON public.companies 
FOR INSERT 
WITH CHECK (true);

-- Update the handle_new_user function to properly create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile with data from user metadata
    INSERT INTO public.profiles (id, full_name, company_id, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
        (NEW.raw_user_meta_data ->> 'company_id')::uuid,
        'Admin'::user_role_enum
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();