-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat attachments storage
CREATE POLICY "Users can upload their chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for chat file upload logs
CREATE TABLE IF NOT EXISTS public.chat_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  parsed_content JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_file_uploads
CREATE POLICY "Users can view their company file uploads"
ON public.chat_file_uploads FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert their company file uploads"
ON public.chat_file_uploads FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their company file uploads"
ON public.chat_file_uploads FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id());

-- Create index for performance
CREATE INDEX idx_chat_file_uploads_company_user ON public.chat_file_uploads(company_id, user_id);
CREATE INDEX idx_chat_file_uploads_status ON public.chat_file_uploads(processing_status);

-- Add trigger for updated_at
CREATE TRIGGER update_chat_file_uploads_updated_at
BEFORE UPDATE ON public.chat_file_uploads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();