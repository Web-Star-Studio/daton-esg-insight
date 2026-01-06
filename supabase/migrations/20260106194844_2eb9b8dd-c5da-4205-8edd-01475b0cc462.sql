-- Add footer_logo_url column to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS footer_logo_url TEXT;