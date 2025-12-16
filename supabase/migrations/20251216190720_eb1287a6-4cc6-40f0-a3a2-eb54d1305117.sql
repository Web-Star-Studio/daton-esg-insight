-- Adicionar campos de controle de inativação na tabela supplier_management
ALTER TABLE supplier_management 
ADD COLUMN IF NOT EXISTS supply_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failure_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_inactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_inactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivation_blocked_until DATE;

-- Criar tabela de falhas de fornecimento
CREATE TABLE IF NOT EXISTS supplier_supply_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  supplier_id UUID REFERENCES supplier_management(id) ON DELETE CASCADE NOT NULL,
  failure_type TEXT NOT NULL CHECK (failure_type IN ('delivery', 'quality', 'document', 'compliance', 'other')),
  failure_date DATE NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  related_evaluation_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supplier_failures_supplier ON supplier_supply_failures(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_failures_company ON supplier_supply_failures(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_failures_date ON supplier_supply_failures(failure_date);

-- Habilitar RLS
ALTER TABLE supplier_supply_failures ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view failures from their company" ON supplier_supply_failures
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert failures for their company" ON supplier_supply_failures
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update failures from their company" ON supplier_supply_failures
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete failures from their company" ON supplier_supply_failures
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Adicionar tipo de alerta para inativação na tabela de alertas existente
ALTER TABLE supplier_expiration_alerts 
ADD COLUMN IF NOT EXISTS alert_category TEXT DEFAULT 'expiration',
ADD COLUMN IF NOT EXISTS auto_inactivation_triggered BOOLEAN DEFAULT FALSE;

-- Função para atualizar contador de falhas e verificar inativação
CREATE OR REPLACE FUNCTION update_supplier_failure_count()
RETURNS TRIGGER AS $$
DECLARE
  v_failure_count INTEGER;
  v_supplier_status TEXT;
BEGIN
  -- Contar falhas nos últimos 12 meses
  SELECT COUNT(*) INTO v_failure_count
  FROM supplier_supply_failures
  WHERE supplier_id = NEW.supplier_id
    AND failure_date > CURRENT_DATE - INTERVAL '12 months';
  
  -- Obter status atual
  SELECT status INTO v_supplier_status
  FROM supplier_management
  WHERE id = NEW.supplier_id;
  
  -- Atualizar contador
  UPDATE supplier_management 
  SET 
    supply_failure_count = v_failure_count,
    last_failure_date = NEW.failure_date,
    updated_at = NOW()
  WHERE id = NEW.supplier_id;
  
  -- Regra: Mais de 3 falhas → Inativar automaticamente
  IF v_failure_count > 3 AND v_supplier_status = 'Ativo' THEN
    UPDATE supplier_management 
    SET 
      status = 'Inativo',
      auto_inactivation_reason = 'Mais de 3 falhas de fornecimento nos últimos 12 meses (' || v_failure_count || ' falhas)',
      auto_inactivated_at = NOW(),
      reactivation_blocked_until = CURRENT_DATE + INTERVAL '90 days',
      updated_at = NOW()
    WHERE id = NEW.supplier_id;
    
    -- Criar alerta de inativação
    INSERT INTO supplier_expiration_alerts (
      company_id, supplier_id, alert_type, reference_name, 
      expiry_date, alert_status, alert_category, auto_inactivation_triggered
    ) VALUES (
      NEW.company_id, NEW.supplier_id, 'inativacao',
      'Inativação automática por falhas de fornecimento',
      CURRENT_DATE, 'Pendente', 'inactivation', TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar contador após inserção de falha
DROP TRIGGER IF EXISTS trigger_update_failure_count ON supplier_supply_failures;
CREATE TRIGGER trigger_update_failure_count
AFTER INSERT ON supplier_supply_failures
FOR EACH ROW EXECUTE FUNCTION update_supplier_failure_count();

-- Função para verificar documentos obrigatórios vencidos
CREATE OR REPLACE FUNCTION check_supplier_mandatory_documents()
RETURNS void AS $$
DECLARE
  r RECORD;
  v_missing_docs INTEGER;
BEGIN
  -- Para cada fornecedor ativo
  FOR r IN 
    SELECT sm.id, sm.company_id, sm.status
    FROM supplier_management sm
    WHERE sm.status = 'Ativo'
  LOOP
    -- Contar documentos obrigatórios vencidos há mais de 30 dias
    SELECT COUNT(*) INTO v_missing_docs
    FROM supplier_document_type_association sdta
    JOIN supplier_type_assignments sta ON sta.supplier_type_id = sdta.supplier_type_id
    LEFT JOIN supplier_documents sd ON sd.supplier_id = r.id 
      AND sd.document_type_id = sdta.document_type_id
      AND sd.status = 'Aprovado'
    WHERE sta.supplier_id = r.id
      AND sdta.is_mandatory = TRUE
      AND (sd.id IS NULL OR sd.expiry_date < CURRENT_DATE - INTERVAL '30 days');
    
    -- Se há documentos obrigatórios faltando há mais de 30 dias
    IF v_missing_docs > 0 THEN
      UPDATE supplier_management 
      SET 
        status = 'Inativo',
        auto_inactivation_reason = 'Documentação obrigatória vencida ou ausente há mais de 30 dias (' || v_missing_docs || ' doc(s))',
        auto_inactivated_at = NOW(),
        reactivation_blocked_until = CURRENT_DATE + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = r.id AND status = 'Ativo';
      
      -- Criar alerta
      INSERT INTO supplier_expiration_alerts (
        company_id, supplier_id, alert_type, reference_name,
        expiry_date, alert_status, alert_category, auto_inactivation_triggered
      ) VALUES (
        r.company_id, r.id, 'inativacao',
        'Inativação automática por documentação obrigatória vencida',
        CURRENT_DATE, 'Pendente', 'inactivation', TRUE
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;