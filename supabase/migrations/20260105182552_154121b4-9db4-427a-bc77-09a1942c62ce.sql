-- Add logo_url to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add customization fields to email_campaigns table
ALTER TABLE public.email_campaigns 
ADD COLUMN IF NOT EXISTS header_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS logo_url TEXT;