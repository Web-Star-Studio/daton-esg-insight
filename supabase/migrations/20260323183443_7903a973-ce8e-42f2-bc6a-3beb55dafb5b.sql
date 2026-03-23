ALTER TABLE public.sgq_iso_documents
  ADD COLUMN IF NOT EXISTS critical_reviewer_user_id UUID,
  ADD COLUMN IF NOT EXISTS critical_review_status TEXT
    CHECK (critical_review_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.audit_notifications
  DROP CONSTRAINT IF EXISTS audit_notifications_notification_type_check;

ALTER TABLE public.audit_notifications
  ADD CONSTRAINT audit_notifications_notification_type_check
  CHECK (notification_type IN (
    'scheduled', 'reminder', 'finding', 'overdue', 'escalation', 'completed',
    'sgq_approval_required', 'sgq_review_requested', 'sgq_review_approved',
    'sgq_review_rejected', 'sgq_read_campaign', 'sgq_expired', 'sgq_expiring',
    'sgq_critical_review_required'
  ));