-- Fix security warning: Set proper search_path for function
CREATE OR REPLACE FUNCTION public.calculate_license_status(
  issue_date_param DATE,
  expiration_date_param DATE,
  current_status license_status_enum
) 
RETURNS license_status_enum
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If manually set to specific statuses, respect them
  IF current_status IN ('Em Renovação', 'Suspensa') THEN
    RETURN current_status;
  END IF;
  
  -- Check if expired
  IF expiration_date_param < CURRENT_DATE THEN
    RETURN 'Vencida';
  END IF;
  
  -- Default to active if not expired
  RETURN 'Ativa';
END;
$$;