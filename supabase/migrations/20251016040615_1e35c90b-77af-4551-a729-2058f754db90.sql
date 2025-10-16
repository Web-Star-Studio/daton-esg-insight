-- Corrigir a função get_user_company_id() para nunca retornar string vazia
-- e melhorar o tratamento de erros
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
    current_user_id := auth.uid();
    
    -- Se não há usuário autenticado, retornar NULL explicitamente
    IF current_user_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No authenticated user';
        RETURN NULL;
    END IF;
    
    -- Buscar company_id do perfil do usuário
    SELECT company_id INTO user_company_id 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    -- Verificar se encontrou um company_id válido
    IF user_company_id IS NULL THEN
        RAISE LOG 'get_user_company_id: User % has NULL company_id', current_user_id;
        RETURN NULL;
    END IF;
    
    -- Verificar se é um UUID válido (não vazio)
    IF user_company_id::text = '' THEN
        RAISE LOG 'get_user_company_id: User % has empty company_id', current_user_id;
        RETURN NULL;
    END IF;
    
    RAISE LOG 'get_user_company_id: Found company_id % for user %', user_company_id, current_user_id;
    RETURN user_company_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'get_user_company_id error for user %: %', current_user_id, SQLERRM;
        RETURN NULL;
END;
$function$;