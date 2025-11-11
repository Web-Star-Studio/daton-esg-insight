-- FASE 1: CORREÇÕES DE SEGURANÇA E PERFORMANCE

-- 1. Corrigir search_path em função principal para prevenir SQL injection
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Criar índices para otimização de queries de documentos
-- (Apenas índices seguros com colunas confirmadas)

CREATE INDEX IF NOT EXISTS idx_documents_company_id 
ON public.documents(company_id);

CREATE INDEX IF NOT EXISTS idx_document_extraction_jobs_company 
ON public.document_extraction_jobs(company_id);

CREATE INDEX IF NOT EXISTS idx_data_collection_tasks_company
ON public.data_collection_tasks(company_id);

-- 3. Comentários explicativos
COMMENT ON FUNCTION public.update_updated_at_column IS 'Atualiza automaticamente updated_at com search_path seguro';
COMMENT ON INDEX idx_documents_company_id IS 'Otimiza queries de documentos por empresa';
COMMENT ON INDEX idx_document_extraction_jobs_company IS 'Otimiza queries de jobs de extração por empresa';