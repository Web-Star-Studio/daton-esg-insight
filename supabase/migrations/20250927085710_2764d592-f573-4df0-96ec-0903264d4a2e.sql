-- Corrigir relacionamento risk_occurrences -> esg_risks
-- Primeiro verificar se existe a tabela risk_occurrences
DO $$
BEGIN
    -- Adicionar foreign key constraint se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_risk_occurrences_esg_risks' 
        AND table_name = 'risk_occurrences'
    ) THEN
        ALTER TABLE public.risk_occurrences 
        ADD CONSTRAINT fk_risk_occurrences_esg_risks 
        FOREIGN KEY (risk_id) REFERENCES public.esg_risks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Corrigir funções sem search_path definido (warning de segurança)
-- Atualizar função que não tem search_path seguro
CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.data_collection_tasks 
    SET status = 'Em Atraso'
    WHERE due_date < CURRENT_DATE 
    AND status = 'Pendente';
END;
$function$;

-- Criar função RPC segura para executar consultas de análise (substituindo exec_sql)
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result jsonb;
    total_risks integer;
    critical_risks integer;
    total_ncs integer;
    open_ncs integer;
BEGIN
    -- Calcular métricas de riscos
    SELECT COUNT(*) INTO total_risks
    FROM public.esg_risks 
    WHERE company_id = p_company_id AND status = 'Ativo';
    
    SELECT COUNT(*) INTO critical_risks
    FROM public.esg_risks 
    WHERE company_id = p_company_id 
    AND status = 'Ativo' 
    AND inherent_risk_level = 'Crítico';
    
    -- Calcular métricas de não conformidades
    SELECT COUNT(*) INTO total_ncs
    FROM public.non_conformities 
    WHERE company_id = p_company_id;
    
    SELECT COUNT(*) INTO open_ncs
    FROM public.non_conformities 
    WHERE company_id = p_company_id 
    AND status IN ('Aberta', 'Em Análise', 'Em Tratamento');
    
    -- Construir resultado
    result := jsonb_build_object(
        'risks', jsonb_build_object(
            'total', total_risks,
            'critical', critical_risks
        ),
        'non_conformities', jsonb_build_object(
            'total', total_ncs,
            'open', open_ncs
        )
    );
    
    RETURN result;
END;
$function$;