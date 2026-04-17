INSERT INTO public.platform_admins (user_id, email, full_name, is_active)
SELECT 'a5bcb20a-88f3-420a-aad6-d04aca1cfed8', 'joaopedrobatista010@gmail.com', 'João Pedro Batista', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_admins WHERE user_id = 'a5bcb20a-88f3-420a-aad6-d04aca1cfed8'
);