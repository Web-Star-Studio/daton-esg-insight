-- Clean up duplicates first, keeping only the most recent for each user
DELETE FROM public.onboarding_selections
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.onboarding_selections
    ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.onboarding_selections 
ADD CONSTRAINT unique_user_onboarding UNIQUE (user_id);