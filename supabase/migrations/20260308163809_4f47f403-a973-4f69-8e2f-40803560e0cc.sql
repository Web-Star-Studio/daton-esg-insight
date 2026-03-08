
-- Add document_level to documents table
DO $$ BEGIN
  CREATE TYPE public.document_level_enum AS ENUM (
    'nivel_1_msg',
    'nivel_2_psg', 
    'nivel_3_it_pso',
    'nivel_4_rg',
    'nivel_5_fplan'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS document_level public.document_level_enum DEFAULT NULL;

-- External documents table for legislation and supplier docs
CREATE TABLE IF NOT EXISTS public.document_external (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'legislacao', -- legislacao, fornecedor, norma, outro
  origin TEXT, -- SOGI, fornecedor name, etc.
  reference_number TEXT, -- law number, norm number
  issuing_authority TEXT,
  publication_date DATE,
  effective_date DATE,
  expiration_date DATE,
  revalidation_date DATE, -- next quarterly revalidation
  revalidation_frequency TEXT DEFAULT 'trimestral', -- trimestral, semestral, anual
  compliance_status TEXT DEFAULT 'vigente', -- vigente, vencido, revogado, revalidado
  responsible_user_id UUID REFERENCES public.profiles(id),
  file_path TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.document_external ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view external docs from their company"
  ON public.document_external FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert external docs for their company"
  ON public.document_external FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update external docs from their company"
  ON public.document_external FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete external docs from their company"
  ON public.document_external FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
