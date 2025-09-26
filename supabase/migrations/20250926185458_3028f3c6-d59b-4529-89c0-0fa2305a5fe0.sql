-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION set_training_program_defaults()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Set company_id from user's profile
    NEW.company_id = get_user_company_id();
    -- Set created_by_user_id to current user
    NEW.created_by_user_id = auth.uid();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_employee_training_defaults()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Set company_id from user's profile
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$;