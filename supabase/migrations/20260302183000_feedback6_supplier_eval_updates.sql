-- Feedback 6 - Supplier evaluation improvements (AVA1 / AVA2 / ALX / Gestão)

-- 1) AVA1 item adequation flag on submissions
ALTER TABLE public.supplier_document_submissions
ADD COLUMN IF NOT EXISTS is_in_adequation BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.supplier_document_submissions
DROP CONSTRAINT IF EXISTS supplier_document_submissions_exempt_adequation_check;

ALTER TABLE public.supplier_document_submissions
ADD CONSTRAINT supplier_document_submissions_exempt_adequation_check
CHECK (
  NOT (
    COALESCE(is_exempt, false) = true
    AND is_in_adequation = true
  )
);

-- 2) AVA1 evaluation fields for strict compliance and historical snapshot
ALTER TABLE public.supplier_document_evaluations
ALTER COLUMN total_weight_required TYPE NUMERIC(10,2)
USING COALESCE(total_weight_required, 0)::NUMERIC(10,2);

ALTER TABLE public.supplier_document_evaluations
ALTER COLUMN total_weight_achieved TYPE NUMERIC(10,2)
USING COALESCE(total_weight_achieved, 0)::NUMERIC(10,2);

ALTER TABLE public.supplier_document_evaluations
ADD COLUMN IF NOT EXISTS compliance_threshold NUMERIC(5,2) NOT NULL DEFAULT 90.00,
ADD COLUMN IF NOT EXISTS is_compliant BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_adequation BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS criteria_snapshot JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE public.supplier_document_evaluations
SET
  compliance_threshold = COALESCE(compliance_threshold, 90.00),
  is_compliant = CASE
    WHEN COALESCE(total_weight_required, 0) = 0 THEN true
    ELSE COALESCE(total_weight_achieved, 0) > (COALESCE(total_weight_required, 0) * 0.9)
  END
WHERE is_compliant = false OR compliance_threshold IS NULL;

