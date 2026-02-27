
-- Create laia_branch_config table
CREATE TABLE public.laia_branch_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  survey_status TEXT NOT NULL DEFAULT 'nao_levantado',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id)
);

-- Enable RLS
ALTER TABLE public.laia_branch_config ENABLE ROW LEVEL SECURITY;

-- RLS policies using get_user_company_id()
CREATE POLICY "Users can view their company branch configs"
ON public.laia_branch_config FOR SELECT
USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert their company branch configs"
ON public.laia_branch_config FOR INSERT
WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their company branch configs"
ON public.laia_branch_config FOR UPDATE
USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete their company branch configs"
ON public.laia_branch_config FOR DELETE
USING (company_id = public.get_user_company_id());

-- Trigger for updated_at
CREATE TRIGGER update_laia_branch_config_updated_at
BEFORE UPDATE ON public.laia_branch_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
