-- Reescreve legislation_compliance_profiles para um modelo jsonb (responses)
-- alinhado ao novo questionário de 21 temas. Os perfis pré-existentes eram
-- de teste e podem ser descartados.

DELETE FROM public.legislation_compliance_profiles;

ALTER TABLE public.legislation_compliance_profiles
  DROP COLUMN IF EXISTS activity_sectors,
  DROP COLUMN IF EXISTS has_fleet,
  DROP COLUMN IF EXISTS has_hazardous_materials,
  DROP COLUMN IF EXISTS has_environmental_license,
  DROP COLUMN IF EXISTS has_wastewater_treatment,
  DROP COLUMN IF EXISTS has_air_emissions,
  DROP COLUMN IF EXISTS has_solid_waste,
  DROP COLUMN IF EXISTS activities,
  DROP COLUMN IF EXISTS waste_types,
  DROP COLUMN IF EXISTS operating_states,
  DROP COLUMN IF EXISTS operating_municipalities,
  DROP COLUMN IF EXISTS employee_count_range,
  DROP COLUMN IF EXISTS certifications,
  DROP COLUMN IF EXISTS industry_type,
  DROP COLUMN IF EXISTS risk_level,
  DROP COLUMN IF EXISTS notes;

ALTER TABLE public.legislation_compliance_profiles
  ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS generated_tags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.legislation_compliance_profiles.responses IS
  'Mapa de respostas do questionário: { [questionId]: string | string[] }. IDs definidos em src/components/legislation/compliance-questionnaire/questions.config.ts.';

COMMENT ON COLUMN public.legislation_compliance_profiles.generated_tags IS
  'Tags de compliance derivadas das respostas no submit. Usadas para filtrar legislações via legislations.applicability_tags.';

CREATE INDEX IF NOT EXISTS idx_legislation_compliance_profiles_generated_tags
  ON public.legislation_compliance_profiles USING GIN (generated_tags);
