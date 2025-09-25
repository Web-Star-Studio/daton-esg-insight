-- Fix security issues - Update function search paths properly

-- Drop triggers first, then functions, then recreate with proper search_path

-- Drop triggers
DROP TRIGGER IF EXISTS create_indicator_alerts ON public.indicator_measurements;
DROP TRIGGER IF EXISTS update_indicator_measurement_deviation ON public.indicator_measurements;

-- Drop functions
DROP FUNCTION IF EXISTS public.create_automatic_alerts();
DROP FUNCTION IF EXISTS public.update_measurement_deviation();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_measurement_deviation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    target_record RECORD;
BEGIN
    -- Buscar meta ativa para o indicador
    SELECT target_value, upper_limit, lower_limit, critical_upper_limit, critical_lower_limit 
    INTO target_record
    FROM indicator_targets 
    WHERE indicator_id = NEW.indicator_id 
    AND is_active = true 
    AND valid_from <= NEW.measurement_date 
    AND (valid_until IS NULL OR valid_until >= NEW.measurement_date)
    ORDER BY valid_from DESC 
    LIMIT 1;
    
    IF target_record IS NOT NULL THEN
        NEW.deviation_level := calculate_indicator_deviation(
            NEW.measured_value,
            target_record.target_value,
            target_record.upper_limit,
            target_record.lower_limit,
            target_record.critical_upper_limit,
            target_record.critical_lower_limit
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_automatic_alerts()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Criar alerta se houver desvio
    IF NEW.deviation_level IN ('warning', 'critical') THEN
        INSERT INTO indicator_alerts (
            indicator_id,
            measurement_id,
            alert_level,
            alert_type,
            alert_message
        ) VALUES (
            NEW.indicator_id,
            NEW.id,
            NEW.deviation_level,
            CASE 
                WHEN NEW.measured_value > (SELECT target_value FROM indicator_targets WHERE indicator_id = NEW.indicator_id AND is_active = true LIMIT 1) 
                THEN 'upper_limit'
                ELSE 'lower_limit'
            END,
            CASE NEW.deviation_level
                WHEN 'warning' THEN 'Indicador fora dos limites de alerta'
                WHEN 'critical' THEN 'Indicador em nível crítico - ação imediata necessária'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_indicator_measurement_deviation
    BEFORE INSERT OR UPDATE ON public.indicator_measurements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_measurement_deviation();

CREATE TRIGGER create_indicator_alerts
    AFTER INSERT OR UPDATE ON public.indicator_measurements
    FOR EACH ROW
    EXECUTE FUNCTION public.create_automatic_alerts();