-- Fix RLS policies for gri_reports table to ensure proper WITH CHECK clauses
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can update their company GRI reports" ON public.gri_reports;
    DROP POLICY IF EXISTS "Users can insert GRI reports for their company" ON public.gri_reports;
    
    -- Create comprehensive policies with both USING and WITH CHECK
    CREATE POLICY "Users can view their company GRI reports"
        ON public.gri_reports
        FOR SELECT
        USING (company_id = get_user_company_id());
    
    CREATE POLICY "Users can insert GRI reports for their company"
        ON public.gri_reports
        FOR INSERT
        WITH CHECK (company_id = get_user_company_id());
    
    CREATE POLICY "Users can update their company GRI reports"
        ON public.gri_reports
        FOR UPDATE
        USING (company_id = get_user_company_id())
        WITH CHECK (company_id = get_user_company_id());
    
    CREATE POLICY "Users can delete their company GRI reports"
        ON public.gri_reports
        FOR DELETE
        USING (company_id = get_user_company_id());
END $$;