-- Migration: Expansão do banco de dados para controle financeiro e logístico de resíduos
-- Baseado na análise do inventário Porto Alegre 2025

-- ============================================================================
-- PARTE 1: ADICIONAR CAMPOS FINANCEIROS DETALHADOS
-- ============================================================================

ALTER TABLE public.waste_logs 
  ADD COLUMN IF NOT EXISTS destination_cost_per_unit NUMERIC(12,2),  -- R$/ton ou R$/kg
  ADD COLUMN IF NOT EXISTS destination_cost_total NUMERIC(12,2),     -- Custo total de destinação
  ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(12,2),             -- Custo de transporte separado
  ADD COLUMN IF NOT EXISTS revenue_per_unit NUMERIC(12,2),           -- R$/ton (para recicláveis)
  ADD COLUMN IF NOT EXISTS revenue_total NUMERIC(12,2),              -- Receita total (venda)
  ADD COLUMN IF NOT EXISTS total_payable NUMERIC(12,2),              -- Custo + Transporte
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2),                -- Valor já pago
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'Pendente', -- Pendente/Parcial/Quitado
  ADD COLUMN IF NOT EXISTS payment_date DATE,                        -- Data de pagamento efetivo
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;                       -- Ex: "Deposito 18/02/2025"

-- ============================================================================
-- PARTE 2: ADICIONAR CAMPOS LOGÍSTICOS
-- ============================================================================

ALTER TABLE public.waste_logs
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR,                      -- Nome do motorista
  ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR,                    -- Placa do veículo
  ADD COLUMN IF NOT EXISTS storage_type VARCHAR;                     -- BAG'S, CAÇAMBA, TANQUES, etc

-- ============================================================================
-- PARTE 3: ADICIONAR CAMPOS DOCUMENTAIS
-- ============================================================================

ALTER TABLE public.waste_logs
  ADD COLUMN IF NOT EXISTS invoice_generator VARCHAR,                -- NF do gerador
  ADD COLUMN IF NOT EXISTS invoice_payment VARCHAR,                  -- NF de pagamento
  ADD COLUMN IF NOT EXISTS cdf_number VARCHAR,                       -- Certificado Destinação Final
  ADD COLUMN IF NOT EXISTS cdf_additional_1 VARCHAR,                 -- CDF adicional 1
  ADD COLUMN IF NOT EXISTS cdf_additional_2 VARCHAR;                 -- CDF adicional 2

-- ============================================================================
-- PARTE 4: CRIAR TABELA DE DOCUMENTOS RELACIONADOS (1:N)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waste_log_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_log_id UUID NOT NULL REFERENCES public.waste_logs(id) ON DELETE CASCADE,
  document_type VARCHAR NOT NULL,  -- 'MTR', 'NF_GERADOR', 'NF_PAGAMENTO', 'CDF'
  document_number VARCHAR NOT NULL,
  issue_date DATE,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 5: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_waste_logs_payment_status ON public.waste_logs(payment_status);
CREATE INDEX IF NOT EXISTS idx_waste_logs_payment_date ON public.waste_logs(payment_date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_company_payment ON public.waste_logs(company_id, payment_status, payment_date);
CREATE INDEX IF NOT EXISTS idx_waste_log_documents_waste_log_id ON public.waste_log_documents(waste_log_id);
CREATE INDEX IF NOT EXISTS idx_waste_log_documents_type ON public.waste_log_documents(document_type);

-- ============================================================================
-- PARTE 6: ADICIONAR TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_waste_log_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waste_log_documents_updated_at
  BEFORE UPDATE ON public.waste_log_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waste_log_documents_updated_at();

-- ============================================================================
-- PARTE 7: CONFIGURAR RLS POLICIES
-- ============================================================================

ALTER TABLE public.waste_log_documents ENABLE ROW LEVEL SECURITY;

-- Policy para visualização de documentos
CREATE POLICY "Users can view their company waste log documents"
ON public.waste_log_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.waste_logs wl
    INNER JOIN public.profiles p ON p.company_id = wl.company_id
    WHERE wl.id = waste_log_documents.waste_log_id
    AND p.id = auth.uid()
  )
);

-- Policy para inserção de documentos
CREATE POLICY "Users can insert their company waste log documents"
ON public.waste_log_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.waste_logs wl
    INNER JOIN public.profiles p ON p.company_id = wl.company_id
    WHERE wl.id = waste_log_documents.waste_log_id
    AND p.id = auth.uid()
  )
);

-- Policy para atualização de documentos
CREATE POLICY "Users can update their company waste log documents"
ON public.waste_log_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.waste_logs wl
    INNER JOIN public.profiles p ON p.company_id = wl.company_id
    WHERE wl.id = waste_log_documents.waste_log_id
    AND p.id = auth.uid()
  )
);

-- Policy para exclusão de documentos
CREATE POLICY "Users can delete their company waste log documents"
ON public.waste_log_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.waste_logs wl
    INNER JOIN public.profiles p ON p.company_id = wl.company_id
    WHERE wl.id = waste_log_documents.waste_log_id
    AND p.id = auth.uid()
  )
);

-- ============================================================================
-- PARTE 8: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN public.waste_logs.destination_cost_per_unit IS 'Custo unitário de destinação em R$/ton ou R$/kg';
COMMENT ON COLUMN public.waste_logs.destination_cost_total IS 'Custo total de destinação em R$';
COMMENT ON COLUMN public.waste_logs.transport_cost IS 'Custo de transporte separado em R$';
COMMENT ON COLUMN public.waste_logs.revenue_per_unit IS 'Receita unitária para recicláveis em R$/ton';
COMMENT ON COLUMN public.waste_logs.revenue_total IS 'Receita total da venda de recicláveis em R$';
COMMENT ON COLUMN public.waste_logs.total_payable IS 'Valor total a pagar (destinação + transporte)';
COMMENT ON COLUMN public.waste_logs.amount_paid IS 'Valor já pago em R$';
COMMENT ON COLUMN public.waste_logs.payment_status IS 'Status do pagamento: Pendente, Parcial ou Quitado';
COMMENT ON COLUMN public.waste_logs.payment_date IS 'Data de pagamento efetivo';
COMMENT ON COLUMN public.waste_logs.payment_notes IS 'Observações sobre o pagamento';
COMMENT ON COLUMN public.waste_logs.driver_name IS 'Nome do motorista responsável pelo transporte';
COMMENT ON COLUMN public.waste_logs.vehicle_plate IS 'Placa do veículo utilizado no transporte';
COMMENT ON COLUMN public.waste_logs.storage_type IS 'Tipo de armazenamento: BAGS, CAÇAMBA, TANQUES, IBC, BAMBONA, AGRANEL';
COMMENT ON COLUMN public.waste_logs.invoice_generator IS 'Número da Nota Fiscal do gerador';
COMMENT ON COLUMN public.waste_logs.invoice_payment IS 'Número da Nota Fiscal de pagamento';
COMMENT ON COLUMN public.waste_logs.cdf_number IS 'Número do Certificado de Destinação Final';
COMMENT ON COLUMN public.waste_logs.cdf_additional_1 IS 'Número do CDF adicional 1';
COMMENT ON COLUMN public.waste_logs.cdf_additional_2 IS 'Número do CDF adicional 2';

COMMENT ON TABLE public.waste_log_documents IS 'Tabela para rastreamento de múltiplos documentos relacionados a registros de resíduos';
COMMENT ON COLUMN public.waste_log_documents.document_type IS 'Tipo de documento: MTR, NF_GERADOR, NF_PAGAMENTO, CDF';
COMMENT ON COLUMN public.waste_log_documents.document_number IS 'Número do documento';
COMMENT ON COLUMN public.waste_log_documents.issue_date IS 'Data de emissão do documento';
COMMENT ON COLUMN public.waste_log_documents.file_url IS 'URL do arquivo do documento (PDF, imagem, etc)';
COMMENT ON COLUMN public.waste_log_documents.notes IS 'Observações adicionais sobre o documento';