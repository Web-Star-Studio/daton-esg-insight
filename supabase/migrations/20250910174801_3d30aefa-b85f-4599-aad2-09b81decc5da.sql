-- Add emission_factor_id column to activity_data table
ALTER TABLE public.activity_data 
ADD COLUMN emission_factor_id UUID REFERENCES public.emission_factors(id);

-- Add index for better performance on emission_factor_id lookups
CREATE INDEX idx_activity_data_emission_factor_id ON public.activity_data(emission_factor_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.activity_data.emission_factor_id IS 'Optional reference to specific emission factor used for calculation. If null, system will auto-select appropriate factor based on category.';