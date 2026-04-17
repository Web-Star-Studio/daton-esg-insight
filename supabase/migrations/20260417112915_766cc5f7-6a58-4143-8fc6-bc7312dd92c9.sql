UPDATE public.user_roles 
SET role = 'platform_admin', updated_at = now()
WHERE user_id = 'a5bcb20a-88f3-420a-aad6-d04aca1cfed8' 
  AND company_id = '5207e9eb-3ac3-462d-aede-07000792d4f5';