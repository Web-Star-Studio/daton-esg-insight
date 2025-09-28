-- Add onboarding completion flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Create onboarding selections table to store user module choices and configurations
CREATE TABLE IF NOT EXISTS public.onboarding_selections (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    selected_modules text[] NOT NULL DEFAULT '{}',
    module_configurations jsonb NOT NULL DEFAULT '{}',
    current_step integer NOT NULL DEFAULT 0,
    total_steps integer NOT NULL DEFAULT 0,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on onboarding_selections
ALTER TABLE public.onboarding_selections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for onboarding_selections
CREATE POLICY "Users can manage their own onboarding selections"
    ON public.onboarding_selections
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_onboarding_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_onboarding_selections_updated_at
    BEFORE UPDATE ON public.onboarding_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_selections_updated_at();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_selections_user_id 
    ON public.onboarding_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_selections_company_id 
    ON public.onboarding_selections(company_id);