-- Create emission_source_glossary table
CREATE TABLE IF NOT EXISTS public.emission_source_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  main_term TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  suggested_scope INTEGER,
  suggested_category TEXT,
  is_global BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emission_source_glossary ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access global terms and their company's terms
CREATE POLICY "Users can access global and company glossary" 
ON public.emission_source_glossary 
FOR SELECT 
USING (is_global = true OR company_id = get_user_company_id());

-- Policy: Users can manage their company's terms
CREATE POLICY "Users can manage their company glossary" 
ON public.emission_source_glossary 
FOR ALL 
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_glossary_usage(term_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.emission_source_glossary
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = term_id;
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_emission_source_glossary_company ON public.emission_source_glossary(company_id);
CREATE INDEX IF NOT EXISTS idx_emission_source_glossary_synonyms ON public.emission_source_glossary USING gin(synonyms);

COMMENT ON TABLE public.emission_source_glossary IS 'Glossário de termos de fontes de emissão com sinônimos e padronização';
COMMENT ON COLUMN public.emission_source_glossary.is_global IS 'Se true, o termo está disponível para todas as empresas (termos padrão do sistema)';
COMMENT ON COLUMN public.emission_source_glossary.usage_count IS 'Número de vezes que o termo foi usado (para ordenação por popularidade)';
