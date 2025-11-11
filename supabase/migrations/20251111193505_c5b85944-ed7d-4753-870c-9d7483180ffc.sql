-- Correção 1: Corrigir função process_pending_retries com referência ambígua
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
  RETURNING 
    document_extraction_jobs.id, 
    document_extraction_jobs.document_id, 
    document_extraction_jobs.retry_count;
END;
$$;

-- Correção 2: Melhorar trigger para capturar mais tipos de erro
CREATE OR REPLACE FUNCTION public.auto_queue_timeout_retry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o job mudou para erro E ainda tem retries disponíveis
  -- Capturar timeouts, API errors, rate limits, HTTP 5xx errors
  IF NEW.status = 'Erro' 
     AND OLD.status != 'Erro'
     AND (
       NEW.error_message ILIKE '%timeout%'
       OR NEW.error_message ILIKE '%rate limit%'
       OR NEW.error_message ILIKE '%API%'
       OR NEW.error_message ILIKE '%503%'
       OR NEW.error_message ILIKE '%502%'
       OR NEW.error_message ILIKE '%500%'
       OR NEW.error_message ILIKE '%429%'
       OR NEW.error_message ILIKE '%connection%'
       OR NEW.error_message ILIKE '%network%'
     )
     AND NEW.retry_count < NEW.max_retries THEN
    
    NEW.retry_count := NEW.retry_count + 1;
    NEW.last_retry_at := now();
    NEW.next_retry_at := now() + calculate_retry_backoff(NEW.retry_count - 1);
    NEW.status := 'Aguardando Retry';
    
    RAISE NOTICE 'Auto-agendando retry para job % (tentativa %/%) - Erro: %', 
      NEW.id, NEW.retry_count, NEW.max_retries, LEFT(NEW.error_message, 100);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Correção 5: Limpar jobs antigos travados
-- Deletar jobs muito antigos (> 30 dias) com erro permanente
DELETE FROM public.document_extraction_jobs
WHERE created_at < now() - INTERVAL '30 days'
  AND status IN ('Erro', 'Falha Permanente');

-- Resetar jobs antigos (< 30 dias) que ainda podem ser reprocessados
UPDATE public.document_extraction_jobs
SET 
  status = 'Aguardando Retry',
  retry_count = 0,
  next_retry_at = now(),
  error_message = 'Resetado para reprocessamento após limpeza do sistema',
  updated_at = now()
WHERE created_at >= now() - INTERVAL '30 days'
  AND status = 'Erro'
  AND retry_count < max_retries;