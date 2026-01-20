-- Add new address fields to branches table for ViaCEP integration
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(255),
ADD COLUMN IF NOT EXISTS street_number VARCHAR(20);