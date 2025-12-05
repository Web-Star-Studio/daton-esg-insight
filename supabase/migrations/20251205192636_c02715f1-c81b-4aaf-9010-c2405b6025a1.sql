-- ======================================
-- FASE 1: Adicionar campos ao cargo (positions)
-- ======================================

-- Adicionar campo de escolaridade exigida
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS required_education_level TEXT;

-- Adicionar campo de tempo de experiência (em anos)
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS required_experience_years NUMERIC;

-- Comentários para documentação
COMMENT ON COLUMN public.positions.required_education_level IS 'Nível de escolaridade exigido para o cargo';
COMMENT ON COLUMN public.positions.required_experience_years IS 'Tempo de experiência exigido em anos';

-- ======================================
-- FASE 2: Criar tabela de documentos de treinamento
-- ======================================

CREATE TABLE IF NOT EXISTS public.training_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view training documents from their company" 
ON public.training_documents 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert training documents for their company" 
ON public.training_documents 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete training documents from their company" 
ON public.training_documents 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_training_documents_program_id ON public.training_documents(training_program_id);
CREATE INDEX IF NOT EXISTS idx_training_documents_company_id ON public.training_documents(company_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_training_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_documents_updated_at
BEFORE UPDATE ON public.training_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_training_documents_updated_at();