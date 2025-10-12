-- Update extraction_approval_log to work with the existing system
-- Add support for both old (document_extraction_jobs) and new (extractions) systems

ALTER TABLE public.extraction_approval_log
  DROP CONSTRAINT IF EXISTS extraction_approval_log_extraction_id_fkey,
  DROP CONSTRAINT IF EXISTS extraction_approval_log_file_id_fkey;

-- Make extraction_id and file_id nullable to support both systems
ALTER TABLE public.extraction_approval_log
  ALTER COLUMN extraction_id DROP NOT NULL,
  ALTER COLUMN file_id DROP NOT NULL;

-- Add columns for the old system
ALTER TABLE public.extraction_approval_log
  ADD COLUMN IF NOT EXISTS preview_id UUID REFERENCES public.extracted_data_preview(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.document_extraction_jobs(id) ON DELETE CASCADE;

-- Create index for faster queries on new columns
CREATE INDEX IF NOT EXISTS idx_extraction_approval_log_preview ON public.extraction_approval_log(preview_id);
CREATE INDEX IF NOT EXISTS idx_extraction_approval_log_job ON public.extraction_approval_log(job_id);

-- Enable realtime for extracted_data_preview
ALTER PUBLICATION supabase_realtime ADD TABLE public.extracted_data_preview;

-- Enable realtime for document_extraction_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_extraction_jobs;