-- Allow NULL values for submitted_by_user_id to support public/anonymous form submissions
ALTER TABLE form_submissions 
ALTER COLUMN submitted_by_user_id DROP NOT NULL;

-- Add comment explaining the nullable field
COMMENT ON COLUMN form_submissions.submitted_by_user_id IS 
'User ID that submitted the form. NULL for anonymous/public submissions.';