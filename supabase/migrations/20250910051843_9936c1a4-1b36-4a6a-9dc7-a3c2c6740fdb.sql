-- Atualizar trigger para criar empresa e profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    company_record RECORD;
BEGIN
    -- Verificar se os dados da empresa estão nos metadados
    IF NEW.raw_user_meta_data ->> 'company_name' IS NOT NULL AND 
       NEW.raw_user_meta_data ->> 'cnpj' IS NOT NULL THEN
       
        -- Criar empresa primeiro
        INSERT INTO public.companies (name, cnpj)
        VALUES (
            NEW.raw_user_meta_data ->> 'company_name',
            NEW.raw_user_meta_data ->> 'cnpj'
        )
        RETURNING * INTO company_record;
        
        -- Criar profile com referência à empresa
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            company_record.id,
            'Admin'::user_role_enum
        );
    ELSE
        -- Fluxo antigo para compatibilidade (quando company_id já existe nos metadados)
        INSERT INTO public.profiles (id, full_name, company_id, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
            COALESCE((NEW.raw_user_meta_data ->> 'company_id')::uuid, NULL),
            'Admin'::user_role_enum
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;