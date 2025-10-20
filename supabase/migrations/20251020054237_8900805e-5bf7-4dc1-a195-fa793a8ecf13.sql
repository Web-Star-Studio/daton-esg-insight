-- Create report_generation_jobs table
CREATE TABLE IF NOT EXISTS public.report_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parameters JSONB NOT NULL DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  output_urls JSONB DEFAULT '[]',
  error_message TEXT,
  estimated_completion TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.report_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company report jobs"
ON public.report_generation_jobs
FOR SELECT
USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can create report jobs for their company"
ON public.report_generation_jobs
FOR INSERT
WITH CHECK (company_id = public.get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their company report jobs"
ON public.report_generation_jobs
FOR UPDATE
USING (company_id = public.get_user_company_id());

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can view their company reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'reports' 
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can upload reports for their company"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_report_jobs_company_status ON public.report_generation_jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_report_jobs_created_at ON public.report_generation_jobs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_report_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_jobs_timestamp
BEFORE UPDATE ON public.report_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_report_jobs_updated_at();