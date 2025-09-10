-- Fix security warning: set search_path for the log_activity function
CREATE OR REPLACE FUNCTION public.log_activity(
    p_company_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_details_json JSONB DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (
        company_id,
        user_id,
        action_type,
        description,
        details_json
    ) VALUES (
        p_company_id,
        p_user_id,
        p_action_type,
        p_description,
        p_details_json
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;