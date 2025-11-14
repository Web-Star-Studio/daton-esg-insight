-- Clean up stuck extraction jobs
-- Update jobs that have been processing for more than 5 minutes
UPDATE document_extraction_jobs
SET 
  status = 'Erro',
  error_message = 'Job expirado - timeout de processamento (mais de 5 minutos)',
  processing_end_time = NOW()
WHERE 
  status = 'Processando' 
  AND processing_start_time < NOW() - INTERVAL '5 minutes';

-- Add index for better performance on job status queries
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status 
ON document_extraction_jobs(status, processing_start_time);

-- Add index for better performance on preview queries
CREATE INDEX IF NOT EXISTS idx_extracted_preview_validation_status 
ON extracted_data_preview(validation_status, created_at);

-- Add helpful comments
COMMENT ON COLUMN document_extraction_jobs.status IS 'Status do job: Aguardando, Processando, Concluído, Erro';
COMMENT ON COLUMN extracted_data_preview.validation_status IS 'Status da validação: Pendente, Aprovado, Rejeitado';