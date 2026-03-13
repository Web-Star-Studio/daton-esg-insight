-- Apply migration: 20260313230000_audit_notifications_insert_policy.sql
-- Adds INSERT RLS policy for audit_notifications table

CREATE POLICY "Authenticated users can insert audit notifications"
  ON public.audit_notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';