-- Remove duplicate emission factors keeping only the most recent ones
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, category, activity_unit, 
                   COALESCE(co2_factor, 0), 
                   COALESCE(ch4_factor, 0), 
                   COALESCE(n2o_factor, 0), 
                   source 
      ORDER BY created_at DESC
    ) as rn
  FROM emission_factors
)
DELETE FROM emission_factors 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);