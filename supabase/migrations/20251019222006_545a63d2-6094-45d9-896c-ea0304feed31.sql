-- Fix handle_new_user trigger to use correct role enum
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
        
        -- Criar profile com referência à empresa (FIXED: using user_role_type)
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            company_record.id,
            'admin'::user_role_type
        );
        
        RAISE LOG 'Profile created for user: % with company: %', NEW.id, company_record.id;
        
    ELSE
        RAISE LOG 'No company data in metadata, checking for company_id';
        
        -- Fluxo antigo para compatibilidade (FIXED: using user_role_type)
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            COALESCE((NEW.raw_user_meta_data ->> 'company_id')::uuid, NULL),
            'admin'::user_role_type
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
            
            -- Criar apenas o profile com a empresa existente (FIXED: using user_role_type)
            INSERT INTO public.profiles (id, full_name, company_id, role)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
                company_record.id,
                'admin'::user_role_type
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