-- Add is_public column to custom_forms table
ALTER TABLE custom_forms 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing published forms to also be public (backward compatibility)
UPDATE custom_forms SET is_public = true WHERE is_published = true;