-- Create missing tables for complete functionality

-- Create waste_logs table
CREATE TABLE IF NOT EXISTS public.waste_logs (
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

-- Enable RLS for waste_logs
ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for waste_logs
CREATE POLICY "Users can manage their company waste logs"
ON public.waste_logs
FOR ALL
USING (company_id = get_user_company_id());

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
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

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
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

-- Create marketplace_favorites table if not exists (it might already exist)
CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    solution_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, solution_id)
);

-- Enable RLS for marketplace_favorites (if newly created)
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for marketplace_favorites (if newly created)
CREATE POLICY "Users can manage their own favorites"
ON public.marketplace_favorites
FOR ALL
USING (user_id = auth.uid() AND company_id = get_user_company_id());

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER update_waste_logs_updated_at
    BEFORE UPDATE ON public.waste_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waste_logs_company_id ON public.waste_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_disposal_date ON public.waste_logs(disposal_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON public.notifications(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- Fix security issue: Remove public access from esg_solution_providers
DROP POLICY IF EXISTS "Anyone can view active providers" ON public.esg_solution_providers;

-- Create restricted policy for esg_solution_providers
CREATE POLICY "Authenticated users can view verified providers"
ON public.esg_solution_providers
FOR SELECT
USING (auth.role() = 'authenticated' AND status = 'active' AND verified = true);