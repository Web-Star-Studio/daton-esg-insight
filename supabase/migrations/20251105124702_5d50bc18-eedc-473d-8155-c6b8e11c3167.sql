-- Add company_profile column to store the complete company profile from onboarding wizard
ALTER TABLE onboarding_selections 
ADD COLUMN company_profile jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN onboarding_selections.company_profile IS 'Stores the complete company profile data including sector, customSector, size, goals, maturityLevel, and currentChallenges';