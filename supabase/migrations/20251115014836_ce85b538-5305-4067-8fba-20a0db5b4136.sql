-- ============================================
-- FASE 1: INTEGRAÇÃO FINANCEIRO-ESG
-- Tabelas, campos e views para vincular dados financeiros com ESG
-- ============================================

-- 1. Criar tabela para vincular transações financeiras a iniciativas ESG
CREATE TABLE IF NOT EXISTS public.esg_financial_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Referência à transação financeira
  financial_entity_type VARCHAR(50) NOT NULL, -- 'accounts_payable', 'accounts_receivable', 'accounting_entry'
  financial_entity_id UUID NOT NULL,
  
  -- Categorização ESG
  esg_category VARCHAR(50) NOT NULL, -- 'Environmental', 'Social', 'Governance'
  esg_pillar VARCHAR(100), -- Sub-categoria (ex: 'Emissões', 'Diversidade', 'Compliance')
  
  -- Vinculação a projetos/iniciativas ESG
  related_project_type VARCHAR(50), -- 'goal', 'social_project', 'conservation_activity', 'training_program'
  related_project_id UUID,
  
  -- Impacto estimado
  carbon_impact_estimate NUMERIC(15,2), -- Estimativa de impacto em tCO2e (pode ser negativo para sequestro)
  social_impact_description TEXT,
  
  -- Metadados
  allocation_percentage NUMERIC(5,2) DEFAULT 100.00, -- % da transação alocada ao ESG (0-100)
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_allocation_percentage CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
);

-- Índices para performance
CREATE INDEX idx_esg_financial_links_company ON public.esg_financial_links(company_id);
CREATE INDEX idx_esg_financial_links_entity ON public.esg_financial_links(financial_entity_type, financial_entity_id);
CREATE INDEX idx_esg_financial_links_category ON public.esg_financial_links(esg_category);
CREATE INDEX idx_esg_financial_links_project ON public.esg_financial_links(related_project_type, related_project_id);

-- RLS Policies
ALTER TABLE public.esg_financial_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's ESG financial links"
  ON public.esg_financial_links FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create ESG financial links for their company"
  ON public.esg_financial_links FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their company's ESG financial links"
  ON public.esg_financial_links FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their company's ESG financial links"
  ON public.esg_financial_links FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Adicionar campos ESG às tabelas financeiras existentes
ALTER TABLE public.accounts_payable 
  ADD COLUMN IF NOT EXISTS esg_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS esg_related_project_id UUID,
  ADD COLUMN IF NOT EXISTS carbon_impact_estimate NUMERIC(15,2);

ALTER TABLE public.accounts_receivable 
  ADD COLUMN IF NOT EXISTS esg_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS esg_related_project_id UUID,
  ADD COLUMN IF NOT EXISTS carbon_impact_estimate NUMERIC(15,2);

ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS esg_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS esg_notes TEXT;

-- 3. Criar view agregada de resumo financeiro-ESG
CREATE OR REPLACE VIEW public.v_esg_financial_summary AS
WITH payables_esg AS (
  SELECT 
    ap.company_id,
    ap.esg_category,
    'Contas a Pagar' as source_type,
    COUNT(*) as transaction_count,
    SUM(ap.final_amount) as total_amount,
    SUM(ap.carbon_impact_estimate) as total_carbon_impact,
    EXTRACT(YEAR FROM ap.due_date) as year,
    EXTRACT(MONTH FROM ap.due_date) as month
  FROM public.accounts_payable ap
  WHERE ap.esg_category IS NOT NULL
  GROUP BY ap.company_id, ap.esg_category, EXTRACT(YEAR FROM ap.due_date), EXTRACT(MONTH FROM ap.due_date)
),
receivables_esg AS (
  SELECT 
    ar.company_id,
    ar.esg_category,
    'Contas a Receber' as source_type,
    COUNT(*) as transaction_count,
    SUM(ar.final_amount) as total_amount,
    SUM(ar.carbon_impact_estimate) as total_carbon_impact,
    EXTRACT(YEAR FROM ar.due_date) as year,
    EXTRACT(MONTH FROM ar.due_date) as month
  FROM public.accounts_receivable ar
  WHERE ar.esg_category IS NOT NULL
  GROUP BY ar.company_id, ar.esg_category, EXTRACT(YEAR FROM ar.due_date), EXTRACT(MONTH FROM ar.due_date)
),
links_esg AS (
  SELECT 
    efl.company_id,
    efl.esg_category,
    'Vínculo Direto' as source_type,
    COUNT(*) as transaction_count,
    0 as total_amount, -- Será calculado via join com transações
    SUM(efl.carbon_impact_estimate) as total_carbon_impact,
    EXTRACT(YEAR FROM efl.created_at) as year,
    EXTRACT(MONTH FROM efl.created_at) as month
  FROM public.esg_financial_links efl
  GROUP BY efl.company_id, efl.esg_category, EXTRACT(YEAR FROM efl.created_at), EXTRACT(MONTH FROM efl.created_at)
)
SELECT * FROM payables_esg
UNION ALL
SELECT * FROM receivables_esg
UNION ALL
SELECT * FROM links_esg;

-- 4. Função para calcular estatísticas ESG financeiras de uma empresa
CREATE OR REPLACE FUNCTION public.get_esg_financial_stats(p_company_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  environmental_costs NUMERIC := 0;
  social_costs NUMERIC := 0;
  governance_costs NUMERIC := 0;
  total_carbon_impact NUMERIC := 0;
  esg_percentage NUMERIC := 0;
  total_expenses NUMERIC := 0;
BEGIN
  -- Se não especificado, usar ano atual
  IF p_year IS NULL THEN
    p_year := EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
  
  -- Calcular custos por categoria ESG (contas a pagar)
  SELECT 
    COALESCE(SUM(CASE WHEN esg_category = 'Environmental' THEN final_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN esg_category = 'Social' THEN final_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN esg_category = 'Governance' THEN final_amount ELSE 0 END), 0),
    COALESCE(SUM(carbon_impact_estimate), 0)
  INTO environmental_costs, social_costs, governance_costs, total_carbon_impact
  FROM public.accounts_payable
  WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM due_date) = p_year
    AND esg_category IS NOT NULL;
  
  -- Calcular total de despesas do ano
  SELECT COALESCE(SUM(final_amount), 0)
  INTO total_expenses
  FROM public.accounts_payable
  WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM due_date) = p_year;
  
  -- Calcular percentual ESG
  IF total_expenses > 0 THEN
    esg_percentage := ((environmental_costs + social_costs + governance_costs) / total_expenses) * 100;
  END IF;
  
  -- Construir resultado
  result := jsonb_build_object(
    'year', p_year,
    'environmental_costs', environmental_costs,
    'social_costs', social_costs,
    'governance_costs', governance_costs,
    'total_esg_costs', environmental_costs + social_costs + governance_costs,
    'total_expenses', total_expenses,
    'esg_percentage', ROUND(esg_percentage, 2),
    'total_carbon_impact', total_carbon_impact,
    'breakdown', jsonb_build_object(
      'Environmental', environmental_costs,
      'Social', social_costs,
      'Governance', governance_costs
    )
  );
  
  RETURN result;
END;
$$;

-- 5. Trigger para atualizar updated_at em esg_financial_links
CREATE OR REPLACE FUNCTION public.update_esg_financial_links_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_esg_financial_links_updated_at
  BEFORE UPDATE ON public.esg_financial_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_esg_financial_links_updated_at();

-- 6. Comentários para documentação
COMMENT ON TABLE public.esg_financial_links IS 'Vincula transações financeiras a iniciativas ESG para rastreamento de ROI e impacto';
COMMENT ON COLUMN public.esg_financial_links.allocation_percentage IS 'Percentual da transação alocado ao ESG (permite rateio)';
COMMENT ON COLUMN public.esg_financial_links.carbon_impact_estimate IS 'Estimativa de impacto em tCO2e - negativo para sequestro';
COMMENT ON VIEW public.v_esg_financial_summary IS 'Agregação de dados financeiros por categoria ESG para dashboards';
COMMENT ON FUNCTION public.get_esg_financial_stats IS 'Retorna estatísticas consolidadas de investimentos ESG por empresa e ano';