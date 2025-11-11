-- Tabela para armazenar regras de deduplicação configuráveis
CREATE TABLE IF NOT EXISTS public.deduplication_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  target_table TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  unique_fields JSONB NOT NULL, -- Array de campos que devem ser únicos
  merge_strategy TEXT NOT NULL DEFAULT 'skip_if_exists', -- skip_if_exists, update_existing, merge_fields
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- Ordem de aplicação das regras
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir que não há regras duplicadas para a mesma tabela e mesmos campos
  UNIQUE(company_id, target_table, rule_name)
);

-- Índices para performance
CREATE INDEX idx_deduplication_rules_company ON public.deduplication_rules(company_id);
CREATE INDEX idx_deduplication_rules_table ON public.deduplication_rules(target_table);
CREATE INDEX idx_deduplication_rules_enabled ON public.deduplication_rules(enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE public.deduplication_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company deduplication rules"
ON public.deduplication_rules FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert deduplication rules for own company"
ON public.deduplication_rules FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company deduplication rules"
ON public.deduplication_rules FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own company deduplication rules"
ON public.deduplication_rules FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_deduplication_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deduplication_rules_timestamp
BEFORE UPDATE ON public.deduplication_rules
FOR EACH ROW
EXECUTE FUNCTION update_deduplication_rules_updated_at();

-- Inserir regras padrão para as tabelas mais comuns
INSERT INTO public.deduplication_rules (company_id, target_table, rule_name, unique_fields, merge_strategy, priority)
SELECT 
  c.id as company_id,
  'emission_sources' as target_table,
  'Fonte de emissão por nome e escopo' as rule_name,
  '["source_name", "scope"]'::jsonb as unique_fields,
  'skip_if_exists' as merge_strategy,
  1 as priority
FROM public.companies c
ON CONFLICT (company_id, target_table, rule_name) DO NOTHING;

INSERT INTO public.deduplication_rules (company_id, target_table, rule_name, unique_fields, merge_strategy, priority)
SELECT 
  c.id as company_id,
  'activity_data' as target_table,
  'Dado de atividade por fonte e período' as rule_name,
  '["emission_source_id", "period_start_date", "period_end_date"]'::jsonb as unique_fields,
  'update_existing' as merge_strategy,
  1 as priority
FROM public.companies c
ON CONFLICT (company_id, target_table, rule_name) DO NOTHING;

INSERT INTO public.deduplication_rules (company_id, target_table, rule_name, unique_fields, merge_strategy, priority)
SELECT 
  c.id as company_id,
  'waste_logs' as target_table,
  'Log de resíduo por tipo e data' as rule_name,
  '["waste_type_id", "log_date"]'::jsonb as unique_fields,
  'skip_if_exists' as merge_strategy,
  1 as priority
FROM public.companies c
ON CONFLICT (company_id, target_table, rule_name) DO NOTHING;

INSERT INTO public.deduplication_rules (company_id, target_table, rule_name, unique_fields, merge_strategy, priority)
SELECT 
  c.id as company_id,
  'licenses' as target_table,
  'Licença por número' as rule_name,
  '["license_number"]'::jsonb as unique_fields,
  'update_existing' as merge_strategy,
  1 as priority
FROM public.companies c
ON CONFLICT (company_id, target_table, rule_name) DO NOTHING;

INSERT INTO public.deduplication_rules (company_id, target_table, rule_name, unique_fields, merge_strategy, priority)
SELECT 
  c.id as company_id,
  'employees' as target_table,
  'Funcionário por CPF' as rule_name,
  '["cpf"]'::jsonb as unique_fields,
  'update_existing' as merge_strategy,
  1 as priority
FROM public.companies c
ON CONFLICT (company_id, target_table, rule_name) DO NOTHING;

COMMENT ON TABLE public.deduplication_rules IS 'Regras configuráveis de deduplicação para evitar inserções duplicadas no banco de dados';
COMMENT ON COLUMN public.deduplication_rules.unique_fields IS 'Array JSON de campos que juntos devem ser únicos. Ex: ["field1", "field2"]';
COMMENT ON COLUMN public.deduplication_rules.merge_strategy IS 'Estratégia ao encontrar duplicata: skip_if_exists (pular), update_existing (atualizar), merge_fields (mesclar campos)';
COMMENT ON COLUMN public.deduplication_rules.priority IS 'Ordem de aplicação quando múltiplas regras existem (menor = maior prioridade)';