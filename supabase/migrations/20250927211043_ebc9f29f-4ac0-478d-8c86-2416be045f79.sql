-- Fix remaining functions with missing search_path
CREATE OR REPLACE FUNCTION public.set_career_plan_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Tentar obter company_id do usuário autenticado
    SELECT company_id INTO NEW.company_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se não encontrou, usar o company_id fornecido
    IF NEW.company_id IS NULL THEN
        -- Manter o company_id que foi passado na requisição
        NULL;
    END IF;
    
    -- Definir created_by_user_id se não foi fornecido
    IF NEW.created_by_user_id IS NULL OR NEW.created_by_user_id = '' THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_mentoring_relationship_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Tentar obter company_id do usuário autenticado
    SELECT company_id INTO NEW.company_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se não encontrou, usar o company_id fornecido
    IF NEW.company_id IS NULL THEN
        -- Manter o company_id que foi passado na requisição
        NULL;
    END IF;
    
    -- Definir created_by_user_id se não foi fornecido
    IF NEW.created_by_user_id IS NULL OR NEW.created_by_user_id = '' THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;