-- Add metadata column to activity_data table for storing additional GHG Protocol compliance data
ALTER TABLE public.activity_data 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add a comment to explain the purpose of the metadata column
COMMENT ON COLUMN public.activity_data.metadata IS 'Stores additional data for GHG Protocol Brasil compliance including source_registry, source_description, economic_sector, fuel_name';