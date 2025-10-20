-- Fix Function Search Paths (Security Critical)
-- Update existing functions to add search_path without dropping

-- Update get_conversion_factor if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'public' AND p.proname = 'get_conversion_factor') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.get_conversion_factor(
        p_emission_source_id uuid,
        p_unit text
      )
      RETURNS numeric
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path TO ''public''
      AS $func$
      DECLARE
        v_factor numeric;
      BEGIN
        SELECT conversion_factor INTO v_factor
        FROM public.emission_factors
        WHERE emission_source_id = p_emission_source_id
          AND unit = p_unit
        LIMIT 1;
        
        RETURN COALESCE(v_factor, 1);
      END;
      $func$';
  END IF;
END $$;

-- Update get_indicator_suggested_value if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'public' AND p.proname = 'get_indicator_suggested_value') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.get_indicator_suggested_value(
        p_indicator_id uuid,
        p_company_id uuid
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path TO ''public''
      AS $func$
      DECLARE
        v_suggested jsonb;
      BEGIN
        SELECT jsonb_build_object(
          ''value'', AVG(value),
          ''confidence'', ''medium'',
          ''based_on'', COUNT(*)
        ) INTO v_suggested
        FROM public.indicator_values
        WHERE indicator_id = p_indicator_id
          AND company_id = p_company_id
          AND created_at > NOW() - INTERVAL ''6 months'';
        
        RETURN COALESCE(v_suggested, ''{}''::jsonb);
      END;
      $func$';
  END IF;
END $$;

-- Create has_company_access if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_company_access(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND company_id = p_company_id
  );
$$;

-- Add RLS policies for tables with RLS enabled but no policies (if they exist)

-- Activity logs policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    DROP POLICY IF EXISTS "Users can view their company activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "Users can insert their company activity logs" ON public.activity_logs;
    
    CREATE POLICY "Users can view their company activity logs"
      ON public.activity_logs
      FOR SELECT
      USING (public.has_company_access(auth.uid(), company_id));
      
    CREATE POLICY "Users can insert their company activity logs"
      ON public.activity_logs
      FOR INSERT
      WITH CHECK (public.has_company_access(auth.uid(), company_id));
  END IF;
END $$;

-- Notifications policies  
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
    
    CREATE POLICY "Users can view their own notifications"
      ON public.notifications
      FOR SELECT
      USING (user_id = auth.uid());
      
    CREATE POLICY "Users can update their own notifications"
      ON public.notifications
      FOR UPDATE
      USING (user_id = auth.uid());
      
    CREATE POLICY "Users can delete their own notifications"
      ON public.notifications
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

COMMENT ON FUNCTION public.has_company_access IS 'Security definer function to check company access - prevents infinite recursion in RLS policies';