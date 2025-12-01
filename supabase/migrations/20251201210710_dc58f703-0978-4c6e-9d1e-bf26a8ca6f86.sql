-- Add new columns to training_programs table
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- Migrate existing scheduled_date data to start_date
UPDATE training_programs 
SET start_date = scheduled_date 
WHERE scheduled_date IS NOT NULL AND start_date IS NULL;