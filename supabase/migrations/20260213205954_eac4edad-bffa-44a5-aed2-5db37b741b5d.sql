CREATE POLICY "Platform admins can view all onboarding selections"
  ON public.onboarding_selections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );