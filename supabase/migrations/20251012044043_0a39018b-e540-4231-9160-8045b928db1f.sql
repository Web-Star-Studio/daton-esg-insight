-- Create extraction_approval_log table
CREATE TABLE IF NOT EXISTS public.extraction_approval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  extraction_id UUID NOT NULL REFERENCES public.extractions(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  approved_by_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'batch_approved', 'edited')),
  items_count INTEGER NOT NULL DEFAULT 0,
  high_confidence_count INTEGER DEFAULT 0,
  edited_fields JSONB DEFAULT '[]'::jsonb,
  approval_notes TEXT,
  processing_time_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_extraction_approval_log_company ON public.extraction_approval_log(company_id);
CREATE INDEX idx_extraction_approval_log_extraction ON public.extraction_approval_log(extraction_id);
CREATE INDEX idx_extraction_approval_log_user ON public.extraction_approval_log(approved_by_user_id);
CREATE INDEX idx_extraction_approval_log_created ON public.extraction_approval_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.extraction_approval_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view logs from their company
CREATE POLICY "Users can view approval logs from their company"
ON public.extraction_approval_log
FOR SELECT
USING (company_id = get_user_company_id());

-- RLS Policy: Users can insert logs for their company
CREATE POLICY "Users can create approval logs for their company"
ON public.extraction_approval_log
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  approved_by_user_id = auth.uid()
);

-- Enable realtime for extraction_items_staging (for live updates during approval)
ALTER PUBLICATION supabase_realtime ADD TABLE public.extraction_items_staging;

-- Enable realtime for extraction_approval_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.extraction_approval_log;