-- Fix the ambiguous completion_percentage reference in calculate_gri_report_completion function
CREATE OR REPLACE FUNCTION public.calculate_gri_report_completion(p_report_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_indicators INTEGER;
    completed_indicators INTEGER;
    total_sections INTEGER;
    completed_sections INTEGER;
    report_completion_percentage INTEGER;
BEGIN
    -- Contar indicadores obrigatórios
    SELECT COUNT(*) INTO total_indicators
    FROM public.gri_indicator_data gid
    JOIN public.gri_indicators_library gil ON gid.indicator_id = gil.id
    WHERE gid.report_id = p_report_id AND gil.is_mandatory = true;
    
    -- Contar indicadores obrigatórios completos
    SELECT COUNT(*) INTO completed_indicators
    FROM public.gri_indicator_data gid
    JOIN public.gri_indicators_library gil ON gid.indicator_id = gil.id
    WHERE gid.report_id = p_report_id 
    AND gil.is_mandatory = true 
    AND gid.is_complete = true;
    
    -- Contar seções
    SELECT COUNT(*) INTO total_sections
    FROM public.gri_report_sections
    WHERE report_id = p_report_id;
    
    -- Contar seções completas
    SELECT COUNT(*) INTO completed_sections
    FROM public.gri_report_sections
    WHERE report_id = p_report_id AND is_complete = true;
    
    -- Calcular percentual (50% indicadores + 50% seções)
    IF total_indicators > 0 AND total_sections > 0 THEN
        report_completion_percentage := ROUND(
            ((completed_indicators::FLOAT / total_indicators) * 50) +
            ((completed_sections::FLOAT / total_sections) * 50)
        );
    ELSIF total_indicators > 0 THEN
        report_completion_percentage := ROUND((completed_indicators::FLOAT / total_indicators) * 100);
    ELSIF total_sections > 0 THEN
        report_completion_percentage := ROUND((completed_sections::FLOAT / total_sections) * 100);
    ELSE
        report_completion_percentage := 0;
    END IF;
    
    -- Atualizar o relatório
    UPDATE public.gri_reports 
    SET completion_percentage = report_completion_percentage 
    WHERE id = p_report_id;
    
    RETURN report_completion_percentage;
END;
$function$;