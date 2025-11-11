-- Create processing_metrics table for monitoring and observability
CREATE TABLE IF NOT EXISTS public.processing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  step_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_metrics_company 
  ON public.processing_metrics(company_id);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_document 
  ON public.processing_metrics(document_id);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_created 
  ON public.processing_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_success 
  ON public.processing_metrics(success);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_step 
  ON public.processing_metrics(step_name);

-- Enable RLS
ALTER TABLE public.processing_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company's processing metrics"
  ON public.processing_metrics
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert processing metrics"
  ON public.processing_metrics
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.processing_metrics IS 'Stores performance and observability metrics for document processing pipeline steps';

-- Grant permissions
GRANT SELECT ON public.processing_metrics TO authenticated;
GRANT INSERT ON public.processing_metrics TO service_role;