-- ============================================
-- Storage: Chat Attachments Bucket + RLS
-- ============================================

-- Create private bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "chat_files_insert_own" ON storage.objects;
  DROP POLICY IF EXISTS "chat_files_select_own" ON storage.objects;
  DROP POLICY IF EXISTS "chat_files_delete_own" ON storage.objects;
END $$;

-- Policy: Users can insert their own files (prefixed by user_id)
CREATE POLICY "chat_files_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (split_part(name, '/', 1) = auth.uid()::text)
);

-- Policy: Users can select their own files
CREATE POLICY "chat_files_select_own" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (split_part(name, '/', 1) = auth.uid()::text)
);

-- Policy: Users can delete their own files
CREATE POLICY "chat_files_delete_own" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'chat-attachments' 
  AND (split_part(name, '/', 1) = auth.uid()::text)
);

-- ============================================
-- Table: chat_file_uploads (telemetry/logs)
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.chat_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('uploaded','processed','error')),
  parsed_content JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_file_uploads ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their company file uploads" ON public.chat_file_uploads;
  DROP POLICY IF EXISTS "Users can insert file uploads" ON public.chat_file_uploads;
END $$;

-- Policy: Users can select their company's files
CREATE POLICY "Users can view their company file uploads"
ON public.chat_file_uploads
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

-- Policy: Users can insert files
CREATE POLICY "Users can insert file uploads"
ON public.chat_file_uploads
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_company_user 
ON public.chat_file_uploads(company_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_status 
ON public.chat_file_uploads(processing_status);