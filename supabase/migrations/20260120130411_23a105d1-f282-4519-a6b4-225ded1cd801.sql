-- Add latitude and longitude columns to branches table for map visualization
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;