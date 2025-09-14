-- Create missing tables and policies (check if exists first)

-- Create waste_logs table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waste_logs') THEN
        CREATE TABLE public.waste_logs (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id UUID NOT NULL,
            user_id UUID NOT NULL,
            waste_type TEXT NOT NULL,
            quantity NUMERIC NOT NULL,
            unit TEXT NOT NULL,
            disposal_method TEXT NOT NULL,
            disposal_date DATE NOT NULL,
            disposal_location TEXT,
            cost NUMERIC,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

        -- Create policy
        CREATE POLICY "Users can manage their company waste logs"
        ON public.waste_logs
        FOR ALL
        USING (company_id = get_user_company_id());

        -- Add trigger
        CREATE TRIGGER update_waste_logs_updated_at
            BEFORE UPDATE ON public.waste_logs
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waste_logs_company_id ON public.waste_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_disposal_date ON public.waste_logs(disposal_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON public.notifications(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- Fix security issue: Update esg_solution_providers policy
DROP POLICY IF EXISTS "Anyone can view active providers" ON public.esg_solution_providers;

CREATE POLICY "Authenticated users can view verified providers"
ON public.esg_solution_providers
FOR SELECT
USING (auth.role() = 'authenticated' AND status = 'active' AND verified = true);