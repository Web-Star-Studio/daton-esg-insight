-- Habilitar Realtime para notificações de processamento de IA
ALTER TABLE document_extraction_jobs REPLICA IDENTITY FULL;
ALTER TABLE extracted_data_preview REPLICA IDENTITY FULL;

-- Criar índices para melhorar performance de queries realtime
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status_updated 
ON document_extraction_jobs(status, updated_at DESC) 
WHERE status IN ('Concluído', 'Erro');

CREATE INDEX IF NOT EXISTS idx_preview_validation_created 
ON extracted_data_preview(validation_status, created_at DESC) 
WHERE validation_status = 'Pendente';