-- Padronizar status de jobs de extração para português
UPDATE public.document_extraction_jobs 
SET status = CASE 
  WHEN status = 'completed' THEN 'Concluído'
  WHEN status = 'processing' THEN 'Processando'
  WHEN status = 'pending' THEN 'Pendente'
  WHEN status = 'error' THEN 'Erro'
  WHEN status = 'failed' THEN 'Erro'
  ELSE status
END
WHERE status IN ('completed', 'processing', 'pending', 'error', 'failed');