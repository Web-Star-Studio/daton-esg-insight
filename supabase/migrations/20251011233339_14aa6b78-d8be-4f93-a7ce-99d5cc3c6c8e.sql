-- Create table for chat conversations
CREATE TABLE IF NOT EXISTS public.ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for chat messages
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_chat_conversations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their company conversations"
  ON public.ai_chat_conversations
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can create conversations for their company"
  ON public.ai_chat_conversations
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their company conversations"
  ON public.ai_chat_conversations
  FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company conversations"
  ON public.ai_chat_conversations
  FOR DELETE
  USING (company_id = get_user_company_id());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their company conversations"
  ON public.ai_chat_messages
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can create messages in their company conversations"
  ON public.ai_chat_messages
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_ai_chat_conversations_company_id ON public.ai_chat_conversations(company_id);
CREATE INDEX idx_ai_chat_conversations_user_id ON public.ai_chat_conversations(user_id);
CREATE INDEX idx_ai_chat_conversations_last_message ON public.ai_chat_conversations(last_message_at DESC);
CREATE INDEX idx_ai_chat_messages_conversation_id ON public.ai_chat_messages(conversation_id);
CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at);

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_chat_conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update conversation when new message is added
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();