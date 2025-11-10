-- Criar tabela para itens do índice GRI
CREATE TABLE IF NOT EXISTS public.gri_content_index_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.gri_indicators_library(id),
  
  -- Informações do indicador
  indicator_code TEXT NOT NULL,
  indicator_title TEXT NOT NULL,
  indicator_description TEXT,
  
  -- Status de atendimento
  disclosure_status TEXT NOT NULL DEFAULT 'fully_reported' 
    CHECK (disclosure_status IN ('fully_reported', 'partially_reported', 'not_applicable', 'omitted')),
  omission_reason TEXT,
  
  -- Localização no relatório
  report_section_id UUID REFERENCES public.gri_report_sections(id),
  page_number INTEGER,
  section_reference TEXT,
  
  -- URL/link direto (para relatórios digitais)
  direct_url TEXT,
  
  -- Conteúdo relacionado
  related_content TEXT,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados IA
  ai_confidence_score DECIMAL(3,2),
  ai_identified BOOLEAN DEFAULT false,
  manually_verified BOOLEAN DEFAULT false,
  verification_notes TEXT,
  
  -- Controle
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_gri_content_index_report ON public.gri_content_index_items(report_id);
CREATE INDEX idx_gri_content_index_indicator ON public.gri_content_index_items(indicator_id);
CREATE INDEX idx_gri_content_index_status ON public.gri_content_index_items(disclosure_status);
CREATE INDEX idx_gri_content_index_ai ON public.gri_content_index_items(ai_identified, ai_confidence_score);

-- RLS Policies
ALTER TABLE public.gri_content_index_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's GRI content index"
  ON public.gri_content_index_items FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM public.gri_reports 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their company's GRI content index"
  ON public.gri_content_index_items FOR ALL
  USING (
    report_id IN (
      SELECT id FROM public.gri_reports 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gri_content_index_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gri_content_index_updated_at
BEFORE UPDATE ON public.gri_content_index_items
FOR EACH ROW
EXECUTE FUNCTION update_gri_content_index_updated_at();

-- Adicionar campos em gri_report_sections
ALTER TABLE public.gri_report_sections
ADD COLUMN IF NOT EXISTS page_number_start INTEGER,
ADD COLUMN IF NOT EXISTS page_number_end INTEGER,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS covered_indicators TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Comentários
COMMENT ON TABLE public.gri_content_index_items IS 'Itens do índice de conteúdo GRI com mapeamento de indicadores para localização no relatório';
COMMENT ON COLUMN public.gri_content_index_items.disclosure_status IS 'Status: fully_reported, partially_reported, not_applicable, omitted';
COMMENT ON COLUMN public.gri_content_index_items.ai_confidence_score IS 'Score de confiança da IA (0.00 a 1.00)';
COMMENT ON COLUMN public.gri_report_sections.covered_indicators IS 'Array de códigos de indicadores GRI cobertos nesta seção';