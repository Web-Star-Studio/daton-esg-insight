CREATE POLICY "Authenticated users can insert audit notifications"
  ON public.audit_notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());
