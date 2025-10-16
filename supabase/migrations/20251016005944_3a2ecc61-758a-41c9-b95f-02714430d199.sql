-- Create AI operation history table
CREATE TABLE IF NOT EXISTS public.ai_operation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  operation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AI operation feedback table
CREATE TABLE IF NOT EXISTS public.ai_operation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_proposed JSONB NOT NULL,
  user_decision TEXT NOT NULL CHECK (user_decision IN ('approved', 'rejected', 'edited')),
  user_edits JSONB,
  confidence_was NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_operation_history_company ON public.ai_operation_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operation_history_user ON public.ai_operation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operation_feedback_company ON public.ai_operation_feedback(company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_operation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_operation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_operation_history
CREATE POLICY "Users can view their company operation history"
  ON public.ai_operation_history FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert operation history for their company"
  ON public.ai_operation_history FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

-- RLS policies for ai_operation_feedback
CREATE POLICY "Users can view their company operation feedback"
  ON public.ai_operation_feedback FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert operation feedback for their company"
  ON public.ai_operation_feedback FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

-- Add helpful comments
COMMENT ON TABLE public.ai_operation_history IS 'Logs all AI-powered data operations executed by users';
COMMENT ON TABLE public.ai_operation_feedback IS 'Stores user feedback on AI-proposed operations for learning';