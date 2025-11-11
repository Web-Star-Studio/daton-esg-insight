-- Adicionar colunas de controle de retry
ALTER TABLE public.document_extraction_jobs 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Índice para queries de retry
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_retry 
ON public.document_extraction_jobs(status, next_retry_at) 
WHERE status = 'Erro' AND retry_count < max_retries;

-- Função para calcular tempo de backoff exponencial
CREATE OR REPLACE FUNCTION public.calculate_retry_backoff(retry_count INTEGER)
RETURNS INTERVAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Backoff exponencial: 2 min, 4 min, 8 min
  RETURN (2 ^ retry_count) * INTERVAL '1 minute';
END;
$$;

-- Função para enfileirar job para retry
CREATE OR REPLACE FUNCTION public.queue_job_for_retry(job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_retry_count INTEGER;
  job_max_retries INTEGER;
  backoff_interval INTERVAL;
BEGIN
  -- Buscar informações do job
  SELECT retry_count, max_retries 
  INTO current_retry_count, job_max_retries
  FROM public.document_extraction_jobs
  WHERE id = job_id;
  
  -- Verificar se job existe
  IF current_retry_count IS NULL THEN
    RAISE NOTICE 'Job % não encontrado', job_id;
    RETURN FALSE;
  END IF;
  
  -- Verificar se ainda pode fazer retry
  IF current_retry_count >= job_max_retries THEN
    RAISE NOTICE 'Job % excedeu limite de retries (%/%)', job_id, current_retry_count, job_max_retries;
    
    -- Marcar como falha permanente
    UPDATE public.document_extraction_jobs
    SET 
      status = 'Falha Permanente',
      error_message = COALESCE(error_message, '') || ' | Falha após ' || max_retries || ' tentativas',
      updated_at = now()
    WHERE id = job_id;
    
    RETURN FALSE;
  END IF;
  
  -- Calcular backoff
  backoff_interval := calculate_retry_backoff(current_retry_count);
  
  -- Atualizar job para retry
  UPDATE public.document_extraction_jobs
  SET 
    retry_count = retry_count + 1,
    last_retry_at = now(),
    next_retry_at = now() + backoff_interval,
    status = 'Aguardando Retry',
    updated_at = now()
  WHERE id = job_id;
  
  RAISE NOTICE 'Job % enfileirado para retry %/% em %', 
    job_id, current_retry_count + 1, job_max_retries, backoff_interval;
  
  RETURN TRUE;
END;
$$;

-- Função para processar jobs pendentes de retry
CREATE OR REPLACE FUNCTION public.process_pending_retries()
RETURNS TABLE(job_id UUID, document_id UUID, retry_attempt INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.document_extraction_jobs
  SET 
    status = 'Pendente',
    updated_at = now()
  WHERE status = 'Aguardando Retry'
    AND next_retry_at <= now()
    AND retry_count < max_retries
  RETURNING id, document_id, retry_count;
END;
$$;

-- Trigger para enfileirar automaticamente jobs com timeout para retry
CREATE OR REPLACE FUNCTION public.auto_queue_timeout_retry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o job mudou para erro devido a timeout E ainda tem retries disponíveis
  IF NEW.status = 'Erro' 
     AND OLD.status != 'Erro'
     AND NEW.error_message LIKE '%timeout%'
     AND NEW.retry_count < NEW.max_retries THEN
    
    -- Calcular backoff e agendar retry
    NEW.retry_count := NEW.retry_count + 1;
    NEW.last_retry_at := now();
    NEW.next_retry_at := now() + calculate_retry_backoff(NEW.retry_count - 1);
    NEW.status := 'Aguardando Retry';
    
    RAISE NOTICE 'Auto-agendando retry para job % (tentativa %/%)', 
      NEW.id, NEW.retry_count, NEW.max_retries;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para auto-retry
DROP TRIGGER IF EXISTS trigger_auto_queue_timeout_retry ON public.document_extraction_jobs;
CREATE TRIGGER trigger_auto_queue_timeout_retry
  BEFORE UPDATE ON public.document_extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_timeout_retry();

-- Comentários
COMMENT ON COLUMN public.document_extraction_jobs.retry_count IS 
'Número de tentativas de reprocessamento já realizadas';

COMMENT ON COLUMN public.document_extraction_jobs.max_retries IS 
'Número máximo de tentativas de reprocessamento permitidas';

COMMENT ON COLUMN public.document_extraction_jobs.next_retry_at IS 
'Timestamp para quando o próximo retry deve ser executado (backoff exponencial)';

COMMENT ON FUNCTION public.queue_job_for_retry(UUID) IS 
'Enfileira um job com erro para reprocessamento automático usando backoff exponencial';

COMMENT ON FUNCTION public.process_pending_retries() IS 
'Processa jobs que estão aguardando retry e cujo tempo de backoff já expirou';

-- Log inicial
DO $$
DECLARE
  retry_candidates INTEGER;
BEGIN
  SELECT COUNT(*) INTO retry_candidates
  FROM public.document_extraction_jobs
  WHERE status = 'Erro' 
    AND error_message LIKE '%timeout%'
    AND retry_count < max_retries;
  
  RAISE NOTICE 'Sistema de retry configurado. % jobs candidatos a retry automático', retry_candidates;
END $$;