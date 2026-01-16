-- =====================================================
-- Tabela de Configuração de Falhas de Fornecedores
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_failure_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL UNIQUE,
  
  -- Critérios de inativação
  max_failures_allowed integer DEFAULT 3,
  failure_period_months integer DEFAULT 12,
  
  -- Pesos por severidade (multiplicador)
  severity_weight_low numeric DEFAULT 0.5,
  severity_weight_medium numeric DEFAULT 1.0,
  severity_weight_high numeric DEFAULT 1.5,
  severity_weight_critical numeric DEFAULT 2.0,
  
  -- Bloqueio de reativação
  reactivation_block_days integer DEFAULT 90,
  
  -- Notificações
  notify_on_failure boolean DEFAULT true,
  notify_on_at_risk boolean DEFAULT true,
  notify_on_inactivation boolean DEFAULT true,
  notify_emails text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE supplier_failure_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their company failure config"
ON supplier_failure_config FOR SELECT
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert their company failure config"
ON supplier_failure_config FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update their company failure config"
ON supplier_failure_config FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_supplier_failure_config_updated_at
  BEFORE UPDATE ON supplier_failure_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão para empresas existentes
INSERT INTO supplier_failure_config (company_id)
SELECT id FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- =====================================================
-- Atualizar Trigger de Contagem de Falhas com Configuração Dinâmica
-- =====================================================

CREATE OR REPLACE FUNCTION update_supplier_failure_count_v3()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_weighted_count NUMERIC;
  v_supplier_status TEXT;
  v_company_id uuid;
BEGIN
  -- Buscar company_id do fornecedor
  SELECT company_id INTO v_company_id FROM supplier_management WHERE id = NEW.supplier_id;
  
  -- Buscar configurações da empresa
  SELECT * INTO v_config FROM supplier_failure_config
  WHERE company_id = v_company_id;
  
  -- Usar defaults se não houver config
  IF v_config IS NULL THEN
    v_config.max_failures_allowed := 3;
    v_config.failure_period_months := 12;
    v_config.severity_weight_low := 0.5;
    v_config.severity_weight_medium := 1.0;
    v_config.severity_weight_high := 1.5;
    v_config.severity_weight_critical := 2.0;
    v_config.reactivation_block_days := 90;
  END IF;
  
  -- Calcular contagem ponderada
  SELECT COALESCE(SUM(
    CASE severity
      WHEN 'low' THEN v_config.severity_weight_low
      WHEN 'medium' THEN v_config.severity_weight_medium
      WHEN 'high' THEN v_config.severity_weight_high
      WHEN 'critical' THEN v_config.severity_weight_critical
      ELSE 1
    END
  ), 0) INTO v_weighted_count
  FROM supplier_supply_failures
  WHERE supplier_id = NEW.supplier_id
    AND failure_date > CURRENT_DATE - (v_config.failure_period_months || ' months')::interval;
  
  -- Atualizar contador
  UPDATE supplier_management 
  SET 
    supply_failure_count = CEIL(v_weighted_count)::integer,
    last_failure_date = NEW.failure_date,
    updated_at = NOW()
  WHERE id = NEW.supplier_id;
  
  -- Verificar se deve inativar
  SELECT status INTO v_supplier_status FROM supplier_management WHERE id = NEW.supplier_id;
  
  IF v_weighted_count > v_config.max_failures_allowed AND v_supplier_status = 'Ativo' THEN
    UPDATE supplier_management 
    SET 
      status = 'Inativo',
      auto_inactivation_reason = format(
        'Limite de falhas excedido: %.1f pontos (máx: %s) nos últimos %s meses',
        v_weighted_count, v_config.max_failures_allowed, v_config.failure_period_months
      ),
      auto_inactivated_at = NOW(),
      reactivation_blocked_until = CURRENT_DATE + (v_config.reactivation_block_days || ' days')::interval,
      updated_at = NOW()
    WHERE id = NEW.supplier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Substituir trigger antigo pelo novo
DROP TRIGGER IF EXISTS update_supplier_failure_count_trigger ON supplier_supply_failures;
CREATE TRIGGER update_supplier_failure_count_trigger
  AFTER INSERT ON supplier_supply_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_failure_count_v3();