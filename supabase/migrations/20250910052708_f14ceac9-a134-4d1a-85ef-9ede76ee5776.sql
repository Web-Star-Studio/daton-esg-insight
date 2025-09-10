-- Primeiro, criar profile manualmente para o usuário existente que não tem profile
INSERT INTO public.profiles (id, full_name, company_id, role)
SELECT 
    '5782442a-d6a5-49f3-8d14-8d21cda4dae2'::uuid as id,
    'Felipe Antunes' as full_name,
    'fdd83760-60eb-445d-b711-6a0d61859925'::uuid as company_id,
    'Admin'::user_role_enum as role
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = '5782442a-d6a5-49f3-8d14-8d21cda4dae2'::uuid
);

-- Corrigir o trigger handle_new_user com melhor tratamento de erros e logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();