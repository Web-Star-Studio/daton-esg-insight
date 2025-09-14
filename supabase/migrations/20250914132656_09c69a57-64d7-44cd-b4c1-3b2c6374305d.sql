-- Simple creation of missing tables without problematic indexes

-- Create notifications table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id UUID NOT NULL,
            user_id UUID NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their company notifications"
        ON public.notifications
        FOR SELECT
        USING (company_id = get_user_company_id() AND user_id = auth.uid());

        CREATE POLICY "System can create notifications"
        ON public.notifications
        FOR INSERT
        WITH CHECK (company_id = get_user_company_id());

        CREATE POLICY "Users can mark their notifications as read"
        ON public.notifications
        FOR UPDATE
        USING (company_id = get_user_company_id() AND user_id = auth.uid());
    END IF;
END $$;

-- Fix security issue: Update esg_solution_providers policy
DROP POLICY IF EXISTS "Anyone can view active providers" ON public.esg_solution_providers;

CREATE POLICY "Authenticated users can view verified providers"
ON public.esg_solution_providers
FOR SELECT
USING (auth.role() = 'authenticated' AND status = 'active' AND verified = true);