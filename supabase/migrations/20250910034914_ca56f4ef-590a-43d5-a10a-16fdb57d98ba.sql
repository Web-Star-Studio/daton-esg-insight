-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.calculate_goal_progress_percentage()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    goal_record RECORD;
    calculated_percentage NUMERIC;
BEGIN
    -- Get goal information
    SELECT baseline_value, target_value 
    INTO goal_record 
    FROM public.goals 
    WHERE id = NEW.goal_id;
    
    -- Calculate progress percentage
    IF goal_record.baseline_value IS NOT NULL AND goal_record.target_value IS NOT NULL THEN
        -- Formula: ((current_value - baseline_value) / (target_value - baseline_value)) * 100
        calculated_percentage := 
            CASE 
                WHEN goal_record.target_value = goal_record.baseline_value THEN 100
                ELSE ((NEW.current_value - goal_record.baseline_value) / 
                     (goal_record.target_value - goal_record.baseline_value)) * 100
            END;
        
        NEW.progress_percentage := ROUND(calculated_percentage, 2);
    END IF;
    
    RETURN NEW;
END;
$$;