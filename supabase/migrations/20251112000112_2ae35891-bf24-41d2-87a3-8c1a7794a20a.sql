-- ============================================================================
-- CORREÇÕES CRÍTICAS PARA LANÇAMENTO EM PRODUÇÃO
-- Data: 11 de Novembro de 2025
-- Objetivo: Resolver 7 bloqueadores críticos identificados na auditoria
-- ============================================================================

-- ============================================================================
-- CORREÇÃO 1: Habilitar RLS e Políticas na tabela sdg_library
-- ============================================================================

-- Garantir que RLS está habilitado
ALTER TABLE public.sdg_library ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Todos podem ler (biblioteca pública)
DROP POLICY IF EXISTS "Public read access to SDG library" ON public.sdg_library;
CREATE POLICY "Public read access to SDG library"
  ON public.sdg_library
  FOR SELECT
  USING (true);

-- Política de escrita: Apenas admins podem modificar
DROP POLICY IF EXISTS "Only admins can modify SDG library" ON public.sdg_library;
CREATE POLICY "Only admins can modify SDG library"
  ON public.sdg_library
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- CORREÇÃO 2: Adicionar políticas na tabela rate_limits
-- ============================================================================

-- Política de leitura: System pode ler
DROP POLICY IF EXISTS "System can read rate limits" ON public.rate_limits;
CREATE POLICY "System can read rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (true);

-- Política de escrita: System pode escrever
DROP POLICY IF EXISTS "System can write rate limits" ON public.rate_limits;
CREATE POLICY "System can write rate limits"
  ON public.rate_limits
  FOR ALL
  USING (true);

-- ============================================================================
-- CORREÇÃO 3: Corrigir search_path em 11 funções SQL
-- ============================================================================

-- Função 1: calculate_retry_backoff
ALTER FUNCTION public.calculate_retry_backoff(integer) 
  SET search_path TO 'public';

-- Função 2: increment_glossary_usage
ALTER FUNCTION public.increment_glossary_usage(uuid) 
  SET search_path TO 'public';

-- Função 3: update_ai_performance_metrics_updated_at
ALTER FUNCTION public.update_ai_performance_metrics_updated_at() 
  SET search_path TO 'public';

-- Função 4: update_energy_consumption_updated_at
ALTER FUNCTION public.update_energy_consumption_updated_at() 
  SET search_path TO 'public';

-- Função 5: update_gri_content_index_updated_at
ALTER FUNCTION public.update_gri_content_index_updated_at() 
  SET search_path TO 'public';

-- Função 6: update_gri_wizard_updated_at
ALTER FUNCTION public.update_gri_wizard_updated_at() 
  SET search_path TO 'public';

-- Função 7: update_report_generated_sections_updated_at
ALTER FUNCTION public.update_report_generated_sections_updated_at() 
  SET search_path TO 'public';

-- Função 8: update_report_jobs_updated_at
ALTER FUNCTION public.update_report_jobs_updated_at() 
  SET search_path TO 'public';

-- Função 9: update_sdg_alignment_timestamp
ALTER FUNCTION public.update_sdg_alignment_timestamp() 
  SET search_path TO 'public';

-- Função 10: update_license_observations_updated_at
ALTER FUNCTION public.update_license_observations_updated_at() 
  SET search_path TO 'public';

-- Função 11: update_license_comments_updated_at
ALTER FUNCTION public.update_license_comments_updated_at() 
  SET search_path TO 'public';

-- ============================================================================
-- CORREÇÃO 5: Limpar e Reprocessar Jobs Antigos
-- ============================================================================

-- Deletar jobs antigos que nunca serão processados (mais de 30 dias)
DELETE FROM public.document_extraction_jobs
WHERE status = 'Pendente'
AND error_message LIKE '%Resetado para reprocessamento%'
AND created_at < NOW() - INTERVAL '30 days';

-- Deletar jobs travados em 'Processando' há muito tempo
DELETE FROM public.document_extraction_jobs
WHERE status = 'Processando'
AND created_at < NOW() - INTERVAL '7 days';

-- Atualizar documentos para permitir reprocessamento
UPDATE public.documents
SET ai_processing_status = 'pending'
WHERE id IN (
  SELECT document_id FROM public.document_extraction_jobs
  WHERE status IN ('Pendente', 'Erro')
  AND created_at > NOW() - INTERVAL '7 days'
);

-- Limpar previews órfãs (sem job associado válido)
DELETE FROM public.extracted_data_preview
WHERE extraction_job_id NOT IN (
  SELECT id FROM public.document_extraction_jobs
);