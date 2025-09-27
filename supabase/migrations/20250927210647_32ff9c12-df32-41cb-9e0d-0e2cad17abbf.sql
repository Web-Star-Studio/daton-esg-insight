-- Fix search_path for functions to address security warnings

-- Fix get_user_company_id function
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix user_has_company_access function
CREATE OR REPLACE FUNCTION public.user_has_company_access(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    company_record RECORD;
BEGIN
    RAISE LOG 'Starting handle_new_user for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
    
    -- Verificar se os dados da empresa estão nos metadados
    IF NEW.raw_user_meta_data ->> 'company_name' IS NOT NULL AND 
       NEW.raw_user_meta_data ->> 'cnpj' IS NOT NULL THEN
       
        RAISE LOG 'Creating company with name: % and CNPJ: %', 
            NEW.raw_user_meta_data ->> 'company_name',
            NEW.raw_user_meta_data ->> 'cnpj';
       
        -- Criar empresa primeiro
        INSERT INTO public.companies (name, cnpj)
        VALUES (
            NEW.raw_user_meta_data ->> 'company_name',
            NEW.raw_user_meta_data ->> 'cnpj'
        )
        RETURNING * INTO company_record;
        
        RAISE LOG 'Company created with ID: %', company_record.id;
        
        -- Criar profile com referência à empresa
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            company_record.id,
            'Admin'::user_role_enum
        );
        
        RAISE LOG 'Profile created for user: % with company: %', NEW.id, company_record.id;
        
    ELSE
        RAISE LOG 'No company data in metadata, checking for company_id';
        
        -- Fluxo antigo para compatibilidade (quando company_id já existe nos metadados)
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            COALESCE((NEW.raw_user_meta_data ->> 'company_id')::uuid, NULL),
            'Admin'::user_role_enum
        );
        
        RAISE LOG 'Profile created with existing company_id';
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RAISE LOG 'Unique violation in handle_new_user for user %: %', NEW.id, SQLERRM;
        -- Se é violação de unicidade na empresa (CNPJ já existe), buscar a empresa existente
        IF SQLERRM LIKE '%companies_cnpj_key%' THEN
            SELECT * INTO company_record 
            FROM public.companies 
            WHERE cnpj = NEW.raw_user_meta_data ->> 'cnpj';
            
            -- Criar apenas o profile com a empresa existente
            INSERT INTO public.profiles (id, full_name, company_id, role)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
                company_record.id,
                'Admin'::user_role_enum
            );
            
            RAISE LOG 'Profile created with existing company: %', company_record.id;
        END IF;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;