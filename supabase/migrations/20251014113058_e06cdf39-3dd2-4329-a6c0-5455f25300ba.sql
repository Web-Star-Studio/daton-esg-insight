-- Add conversation_id column to chat_file_uploads table
ALTER TABLE public.chat_file_uploads 
ADD COLUMN conversation_id UUID NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_conversation_id 
ON public.chat_file_uploads(conversation_id);

-- Add index for company_id + conversation_id combination
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_company_conversation 
ON public.chat_file_uploads(company_id, conversation_id);

-- Update RLS policy to include conversation_id in access control
DROP POLICY IF EXISTS "Users can view their company file uploads" ON public.chat_file_uploads;
CREATE POLICY "Users can view their company file uploads"
ON public.chat_file_uploads
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company file uploads" ON public.chat_file_uploads;
CREATE POLICY "Users can insert their company file uploads"
ON public.chat_file_uploads
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id());