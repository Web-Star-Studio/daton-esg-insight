-- Corrigir função set_career_plan_company_id que compara UUID com string vazia
CREATE OR REPLACE FUNCTION public.set_career_plan_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Tentar obter company_id do usuário autenticado
    SELECT company_id INTO NEW.company_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se não encontrou, manter o company_id que foi passado na requisição
    -- (não precisa de ação explícita)
    
    -- Definir created_by_user_id se não foi fornecido
    -- CORREÇÃO: Remover comparação com '' que causa erro de conversão UUID
    IF NEW.created_by_user_id IS NULL THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Corrigir também set_mentoring_relationship_company_id que tem o mesmo problema
CREATE OR REPLACE FUNCTION public.set_mentoring_relationship_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Tentar obter company_id do usuário autenticado
    SELECT company_id INTO NEW.company_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se não encontrou, manter o company_id que foi passado na requisição
    -- (não precisa de ação explícita)
    
    -- Definir created_by_user_id se não foi fornecido
    -- CORREÇÃO: Remover comparação com '' que causa erro de conversão UUID
    IF NEW.created_by_user_id IS NULL THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;