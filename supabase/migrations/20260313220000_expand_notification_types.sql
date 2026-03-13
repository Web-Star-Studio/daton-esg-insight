ALTER TABLE public.audit_notifications
  DROP CONSTRAINT IF EXISTS audit_notifications_notification_type_check;

ALTER TABLE public.audit_notifications
  ADD CONSTRAINT audit_notifications_notification_type_check
  CHECK (notification_type IN (
    'scheduled', 'reminder', 'finding', 'overdue', 'escalation', 'completed',
    'sgq_approval_required', 'sgq_review_requested', 'sgq_review_approved',
    'sgq_review_rejected', 'sgq_read_campaign', 'sgq_expired', 'sgq_expiring'
  ));
