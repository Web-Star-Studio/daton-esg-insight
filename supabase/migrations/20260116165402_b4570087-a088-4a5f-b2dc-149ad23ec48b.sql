-- Add tracking columns to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS campaign_send_id uuid REFERENCES email_campaign_sends(id) ON DELETE SET NULL;

ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS respondent_email text;

ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS respondent_name text;

ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS respondent_phone text;

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_send ON form_submissions(campaign_send_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_respondent_email ON form_submissions(respondent_email);

-- Function to increment campaign responded count atomically
CREATE OR REPLACE FUNCTION increment_campaign_responded(p_campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns 
  SET responded_count = COALESCE(responded_count, 0) + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;