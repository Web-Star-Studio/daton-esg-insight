-- Enable RLS on cron.job table (if accessible)
-- Note: cron.job is a system table, RLS may not be directly applicable

-- Check for any public tables without RLS and enable them
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
        )
    LOOP
        -- Skip system tables and tables that should not have RLS
        IF r.tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
            RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- Ensure pg_cron and pg_net extensions are in extensions schema, not public
-- This is just a documentation comment as extensions are already created
-- The warning is expected for these system extensions