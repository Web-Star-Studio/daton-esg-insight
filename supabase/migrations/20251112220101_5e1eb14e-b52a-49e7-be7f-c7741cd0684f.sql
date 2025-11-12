-- Fase 3: Tabela de auto-aprendizado de mapeamentos de campos
CREATE TABLE IF NOT EXISTS public.field_mapping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_field_name TEXT NOT NULL,
  target_field_name TEXT NOT NULL,
  target_table TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_field_mapping_history_company ON public.field_mapping_history(company_id);
CREATE INDEX idx_field_mapping_history_source ON public.field_mapping_history(source_field_name);
CREATE INDEX idx_field_mapping_history_target ON public.field_mapping_history(target_table, target_field_name);
CREATE INDEX idx_field_mapping_history_usage ON public.field_mapping_history(usage_count DESC);

-- RLS Policies
ALTER TABLE public.field_mapping_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's field mappings"
ON public.field_mapping_history FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert field mappings for their company"
ON public.field_mapping_history FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company's field mappings"
ON public.field_mapping_history FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Função para incrementar usage_count
CREATE OR REPLACE FUNCTION public.increment_field_mapping_usage(
  p_company_id UUID,
  p_source_field TEXT,
  p_target_field TEXT,
  p_target_table TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.field_mapping_history (
    company_id,
    source_field_name,
    target_field_name,
    target_table,
    usage_count,
    last_used_at
  ) VALUES (
    p_company_id,
    p_source_field,
    p_target_field,
    p_target_table,
    1,
    now()
  )
  ON CONFLICT (company_id, source_field_name, target_field_name, target_table)
  DO UPDATE SET
    usage_count = field_mapping_history.usage_count + 1,
    last_used_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar unique constraint
ALTER TABLE public.field_mapping_history 
ADD CONSTRAINT field_mapping_history_unique 
UNIQUE (company_id, source_field_name, target_field_name, target_table);

-- Adicionar campo mapping_notes no extracted_data_preview
ALTER TABLE public.extracted_data_preview 
ADD COLUMN IF NOT EXISTS mapping_notes TEXT;

COMMENT ON TABLE public.field_mapping_history IS 'Histórico de mapeamentos de campos para auto-aprendizado do sistema';
COMMENT ON COLUMN public.field_mapping_history.confidence_score IS 'Score de confiança do mapeamento (0-1), aumenta com aprovações';
COMMENT ON COLUMN public.field_mapping_history.usage_count IS 'Número de vezes que este mapeamento foi usado com sucesso';