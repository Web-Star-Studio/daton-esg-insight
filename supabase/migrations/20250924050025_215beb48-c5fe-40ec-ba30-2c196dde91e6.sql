-- Criar tabelas para SWOT Analysis
CREATE TABLE public.swot_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  strategic_map_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.swot_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swot_analysis_id UUID NOT NULL REFERENCES public.swot_analysis(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('strengths', 'weaknesses', 'opportunities', 'threats')),
  item_text TEXT NOT NULL,
  description TEXT,
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabelas para OKRs
CREATE TABLE public.okrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  strategic_map_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  owner_user_id UUID,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  due_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'at_risk')),
  owner_user_id UUID,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS policies
ALTER TABLE public.swot_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Policies para SWOT
CREATE POLICY "Users can manage their company SWOT analysis" 
ON public.swot_analysis 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage SWOT items from their company analysis" 
ON public.swot_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.swot_analysis 
  WHERE swot_analysis.id = swot_items.swot_analysis_id 
  AND swot_analysis.company_id = get_user_company_id()
));

-- Policies para OKRs
CREATE POLICY "Users can manage their company OKRs" 
ON public.okrs 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage key results from their company OKRs" 
ON public.key_results 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.okrs 
  WHERE okrs.id = key_results.okr_id 
  AND okrs.company_id = get_user_company_id()
));

-- Adicionar triggers para updated_at
CREATE TRIGGER update_swot_analysis_updated_at
  BEFORE UPDATE ON public.swot_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swot_items_updated_at
  BEFORE UPDATE ON public.swot_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at
  BEFORE UPDATE ON public.okrs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_swot_analysis_company_id ON public.swot_analysis(company_id);
CREATE INDEX idx_swot_items_analysis_id ON public.swot_items(swot_analysis_id);
CREATE INDEX idx_okrs_company_id ON public.okrs(company_id);
CREATE INDEX idx_key_results_okr_id ON public.key_results(okr_id);