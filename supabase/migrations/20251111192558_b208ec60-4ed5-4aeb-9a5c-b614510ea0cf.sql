-- Limpar jobs travados em 'Processando' (mais de 15 minutos)
UPDATE public.document_extraction_jobs
SET 
  status = 'Erro',
  error_message = 'Job timeout: processamento excedeu 15 minutos',
  updated_at = now()
WHERE status = 'Processando'
  AND created_at < now() - INTERVAL '15 minutes';

-- Adicionar coluna para rastrear quando o processamento começou
ALTER TABLE public.document_extraction_jobs 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Adicionar índice para queries de timeout
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_timeout 
ON public.document_extraction_jobs(status, started_at) 
WHERE status = 'Processando';

-- Função para verificar e marcar jobs com timeout
CREATE OR REPLACE FUNCTION public.check_job_timeouts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jobs_updated INTEGER := 0;
  rows_affected INTEGER;
BEGIN
  -- Marcar jobs que estão processando há mais de 15 minutos como erro
  UPDATE public.document_extraction_jobs
  SET 
    status = 'Erro',
    error_message = 'Job timeout: processamento excedeu o tempo limite de 15 minutos',
    updated_at = now()
  WHERE status = 'Processando'
    AND started_at IS NOT NULL
    AND started_at < now() - INTERVAL '15 minutes';
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  jobs_updated := rows_affected;
  
  -- Também marcar jobs sem started_at que foram criados há muito tempo
  UPDATE public.document_extraction_jobs
  SET 
    status = 'Erro',
    error_message = 'Job timeout: processamento não iniciou ou travou',
    updated_at = now()
  WHERE status = 'Processando'
    AND started_at IS NULL
    AND created_at < now() - INTERVAL '20 minutes';
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  jobs_updated := jobs_updated + rows_affected;
  
  RETURN jobs_updated;
END;
$$;

COMMENT ON FUNCTION public.check_job_timeouts() IS 
'Verifica e marca jobs de extração que excederam o tempo limite como erro. Retorna o número de jobs atualizados.';

-- Trigger para definir started_at automaticamente quando status muda para Processando
CREATE OR REPLACE FUNCTION public.set_job_started_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando o status mudar para 'Processando', definir started_at
  IF NEW.status = 'Processando' AND (OLD IS NULL OR OLD.status != 'Processando') THEN
    NEW.started_at = now();
  END IF;
  
  -- Quando o status sair de 'Processando', limpar started_at
  IF OLD IS NOT NULL AND NEW.status != 'Processando' AND OLD.status = 'Processando' THEN
    NEW.started_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para rastrear início do processamento
DROP TRIGGER IF EXISTS trigger_set_job_started_at ON public.document_extraction_jobs;
CREATE TRIGGER trigger_set_job_started_at
  BEFORE INSERT OR UPDATE ON public.document_extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_job_started_at();

-- Log de limpeza
DO $$
DECLARE
  cleaned_jobs INTEGER;
BEGIN
  SELECT COUNT(*) INTO cleaned_jobs
  FROM public.document_extraction_jobs
  WHERE status = 'Erro' 
    AND error_message LIKE 'Job timeout:%'
    AND updated_at > now() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Limpeza concluída: % jobs travados foram marcados como erro', cleaned_jobs;
END $$;