-- Add missing columns to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;