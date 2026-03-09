
INSERT INTO public.platform_admins (user_id, email, full_name)
VALUES ('48e5f925-9470-43a5-91b7-01490747cec3', 'fgsantunes@gmail.com', 'Felipe Antunes')
ON CONFLICT DO NOTHING;

UPDATE public.user_roles
SET role = 'platform_admin', updated_at = now()
WHERE user_id = '48e5f925-9470-43a5-91b7-01490747cec3';
