-- FASE 1: Atualizar tabela gri_reports com novos campos

-- Adicionar campos para público-alvo, diretrizes e propósito
ALTER TABLE gri_reports 
ADD COLUMN IF NOT EXISTS target_audience TEXT[], 
ADD COLUMN IF NOT EXISTS guidelines_file_path TEXT,
ADD COLUMN IF NOT EXISTS organization_purpose TEXT,
ADD COLUMN IF NOT EXISTS report_objective TEXT;

-- Comentários para documentação
COMMENT ON COLUMN gri_reports.target_audience IS 'Array com público-alvo: investors, shareholders, employees, customers, suppliers, society';
COMMENT ON COLUMN gri_reports.guidelines_file_path IS 'Caminho no Storage para planilha de diretrizes';
COMMENT ON COLUMN gri_reports.organization_purpose IS 'Propósito confirmado pelo usuário';
COMMENT ON COLUMN gri_reports.report_objective IS 'Objetivo específico deste relatório';

-- Criar índice GIN para melhor performance em queries com arrays
CREATE INDEX IF NOT EXISTS idx_gri_reports_target_audience ON gri_reports USING GIN (target_audience);

-- Criar bucket de storage para documentos GRI (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gri-documents', 'gri-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket gri-documents
CREATE POLICY "Users can upload their company's GRI documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'gri-documents' AND
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view their company's GRI documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'gri-documents' AND
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their company's GRI documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'gri-documents' AND
  auth.uid() IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.company_id::text = (storage.foldername(name))[1]
  )
);