
ALTER TABLE public.profiles 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET is_approved = true WHERE has_completed_onboarding = true;
