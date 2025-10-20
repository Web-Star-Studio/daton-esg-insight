-- ============================================
-- UPDATE: Trigger to use user_roles table
-- ============================================
-- Update handle_new_user trigger to insert role into user_roles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_record RECORD;
BEGIN
    RAISE LOG 'Starting handle_new_user for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
    
    -- Check if company data exists in metadata
    IF NEW.raw_user_meta_data ->> 'company_name' IS NOT NULL AND 
       NEW.raw_user_meta_data ->> 'cnpj' IS NOT NULL THEN
       
        RAISE LOG 'Creating company with name: % and CNPJ: %', 
            NEW.raw_user_meta_data ->> 'company_name',
            NEW.raw_user_meta_data ->> 'cnpj';
       
        -- Create company first
        INSERT INTO public.companies (name, cnpj)
        VALUES (
            NEW.raw_user_meta_data ->> 'company_name',
            NEW.raw_user_meta_data ->> 'cnpj'
        )
        RETURNING * INTO company_record;
        
        RAISE LOG 'Company created with ID: %', company_record.id;
        
        -- Create profile WITHOUT role (role goes to user_roles table)
        INSERT INTO public.profiles (id, full_name, company_id)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            company_record.id
        );
        
        -- SECURE: Insert role into user_roles table (CRITICAL SECURITY FIX)
        INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
        VALUES (
            NEW.id,
            'admin'::user_role_type,
            company_record.id,
            NEW.id
        );
        
        RAISE LOG 'Profile and role created for user: % with company: %', NEW.id, company_record.id;
        
    ELSE
        RAISE LOG 'No company data in metadata, checking for company_id';
        
        -- Legacy flow for compatibility
        INSERT INTO public.profiles (id, full_name, company_id)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            COALESCE((NEW.raw_user_meta_data ->> 'company_id')::uuid, NULL)
        );
        
        -- SECURE: Insert role into user_roles table if company_id exists
        IF (NEW.raw_user_meta_data ->> 'company_id')::uuid IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
            VALUES (
                NEW.id,
                'admin'::user_role_type,
                (NEW.raw_user_meta_data ->> 'company_id')::uuid,
                NEW.id
            );
        END IF;
        
        RAISE LOG 'Profile created with existing company_id';
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RAISE LOG 'Unique violation in handle_new_user for user %: %', NEW.id, SQLERRM;
        -- If unique violation on company (CNPJ exists), find existing company
        IF SQLERRM LIKE '%companies_cnpj_key%' THEN
            SELECT * INTO company_record 
            FROM public.companies 
            WHERE cnpj = NEW.raw_user_meta_data ->> 'cnpj';
            
            -- Create only profile with existing company
            INSERT INTO public.profiles (id, full_name, company_id)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
                company_record.id
            );
            
            -- SECURE: Insert role into user_roles table
            INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
            VALUES (
                NEW.id,
                'admin'::user_role_type,
                company_record.id,
                NEW.id
            );
            
            RAISE LOG 'Profile and role created with existing company: %', company_record.id;
        END IF;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;