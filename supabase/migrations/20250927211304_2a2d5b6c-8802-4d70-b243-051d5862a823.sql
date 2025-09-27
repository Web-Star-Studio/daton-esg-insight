-- Fix the last function with missing search_path
CREATE OR REPLACE FUNCTION public.policy_exists(table_name text, policy_name text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    );
END;
$function$;