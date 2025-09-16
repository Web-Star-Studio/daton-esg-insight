-- Fix RLS policies for emission_factors table to allow system factor insertion

-- Drop existing policy for system factor insertion
DROP POLICY IF EXISTS "System can insert emission factors" ON public.emission_factors;

-- Create new policy that allows insertion of system factors
CREATE POLICY "System can insert emission factors" 
ON public.emission_factors 
FOR INSERT 
WITH CHECK (
  type = 'system'::emission_factor_type_enum 
  AND company_id IS NULL
);

-- Update policy for viewing system factors to be more permissive
DROP POLICY IF EXISTS "Users can view system emission factors" ON public.emission_factors;

CREATE POLICY "Users can view system emission factors" 
ON public.emission_factors 
FOR SELECT 
USING (
  type = 'system'::emission_factor_type_enum 
  OR (type = 'custom'::emission_factor_type_enum AND company_id = get_user_company_id())
);