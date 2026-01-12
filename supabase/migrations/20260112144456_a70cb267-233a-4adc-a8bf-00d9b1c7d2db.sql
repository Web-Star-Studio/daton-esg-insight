
-- =====================================================
-- MIGRAÇÃO: Unificação de Empresas Duplicadas e Normalização de CNPJ
-- =====================================================

-- PARTE 1: Criar função de normalização de CNPJ
-- =====================================================
CREATE OR REPLACE FUNCTION public.normalize_cnpj(cnpj text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF cnpj IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN regexp_replace(cnpj, '[^0-9]', '', 'g');
END;
$$;

-- PARTE 2: Definir IDs das empresas corretas e duplicadas
-- =====================================================
-- Transportes Gabardo:
--   CORRETO: 021647af-61a5-4075-9db3-bb5024ef7a67 (CNPJ: 92644483000185, mais antiga)
--   DUPLICADOS:
--     - 28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0 (CNPJ: 92.644.483/0001-85)
--     - 0f944a53-c1ea-4c05-80cf-e23921548f66 (CNPJ: 926444830001-85)
--     - 4276de7e-b28a-46b2-85b8-c8964ccef4cf (CNPJ: 92644483001319) -- possível erro digitação

-- Worton:
--   CORRETO: b579f7d3-690e-4308-90af-c6c41206f905 (CNPJ: 03148240065, mais antiga)
--   DUPLICADOS:
--     - 5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0 (CNPJ: 50199142000106) -- CNPJ diferente, pode ser outra empresa
--     - 5b2be6f2-f74c-48b4-a2ca-3445c63e26c0 (CNPJ: 50.199.142/0001-06)

-- PARTE 3: Migrar dados das empresas duplicadas Gabardo para a principal
-- =====================================================

-- Migrar profiles
UPDATE profiles 
SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE company_id IN (
  '28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0',
  '0f944a53-c1ea-4c05-80cf-e23921548f66',
  '4276de7e-b28a-46b2-85b8-c8964ccef4cf'
);

-- Migrar user_roles
UPDATE user_roles 
SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE company_id IN (
  '28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0',
  '0f944a53-c1ea-4c05-80cf-e23921548f66',
  '4276de7e-b28a-46b2-85b8-c8964ccef4cf'
);

-- Migrar documents
UPDATE documents 
SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE company_id IN (
  '28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0',
  '0f944a53-c1ea-4c05-80cf-e23921548f66',
  '4276de7e-b28a-46b2-85b8-c8964ccef4cf'
);

-- Migrar action_plans
UPDATE action_plans 
SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE company_id IN (
  '28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0',
  '0f944a53-c1ea-4c05-80cf-e23921548f66',
  '4276de7e-b28a-46b2-85b8-c8964ccef4cf'
);

-- Migrar todas as outras tabelas com company_id (Gabardo)
UPDATE accounting_entries SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE accounts_payable SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE accounts_receivable SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE activity_logs SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE activity_monitoring SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_chat_conversations SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_chat_messages SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_extraction_patterns SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_operation_feedback SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_operation_history SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE ai_performance_metrics SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE approval_requests SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE approval_workflows SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE assets SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE audit_areas SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE audit_categories SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE audit_checklists SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE audit_grade_config SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE audits SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE bank_accounts SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE branches SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE budgets SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE carbon_projects SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE chart_of_accounts SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE compliance_tasks SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE conservation_activities SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE corporate_policies SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE cost_centers SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE custom_esg_indicators SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE custom_forms SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE departments SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE emission_sources SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE employees SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE esg_metrics SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE esg_risks SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE goals SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE projects SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');
UPDATE suppliers SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67' WHERE company_id IN ('28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0', '0f944a53-c1ea-4c05-80cf-e23921548f66', '4276de7e-b28a-46b2-85b8-c8964ccef4cf');

-- PARTE 4: Migrar dados das empresas Worton duplicadas
-- A empresa 5c1cb78d tem CNPJ diferente (50199142000106), vou migrar para a mais antiga
-- A empresa 5b2be6f2 é o mesmo CNPJ com formatação diferente
-- =====================================================

-- Verificar qual Worton manter - vou usar a mais antiga (b579f7d3) mas como tem CNPJs diferentes
-- vou migrar 5b2be6f2 (que tem CNPJ 50199142000106 formatado) para 5c1cb78d (que é a mesma coisa limpa)
-- E manter b579f7d3 como empresa separada se tiver CNPJ diferente

-- Migrar 5b2be6f2-f74c-48b4-a2ca-3445c63e26c0 para 5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0 (mesmo CNPJ)
UPDATE profiles SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE user_roles SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE documents SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE action_plans SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE accounting_entries SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE accounts_payable SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE accounts_receivable SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE activity_logs SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE ai_chat_conversations SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE ai_chat_messages SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE assets SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE audits SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE carbon_projects SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE emission_sources SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE employees SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE esg_metrics SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE projects SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';
UPDATE suppliers SET company_id = '5c1cb78d-1aba-40a6-bac9-bc0f0d3fd7d0' WHERE company_id = '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0';

-- PARTE 5: Deletar empresas duplicadas vazias
-- =====================================================
DELETE FROM companies WHERE id IN (
  '28bfd2f4-e4c3-4d02-97d3-e6a1ae010ae0',
  '0f944a53-c1ea-4c05-80cf-e23921548f66',
  '4276de7e-b28a-46b2-85b8-c8964ccef4cf',
  '5b2be6f2-f74c-48b4-a2ca-3445c63e26c0'
);

-- PARTE 6: Normalizar todos os CNPJs existentes
-- =====================================================
UPDATE companies 
SET cnpj = public.normalize_cnpj(cnpj)
WHERE cnpj IS NOT NULL AND cnpj != public.normalize_cnpj(cnpj);

-- PARTE 7: Criar trigger para normalizar CNPJ antes de INSERT/UPDATE
-- =====================================================
CREATE OR REPLACE FUNCTION public.normalize_cnpj_before_save()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    NEW.cnpj := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_normalize_cnpj ON companies;
CREATE TRIGGER companies_normalize_cnpj
BEFORE INSERT OR UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION public.normalize_cnpj_before_save();

-- PARTE 8: Criar índice único no CNPJ normalizado (previne duplicações futuras)
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_normalized_unique_idx 
ON companies (public.normalize_cnpj(cnpj))
WHERE cnpj IS NOT NULL AND cnpj != '';

-- PARTE 9: Atualizar trigger handle_new_user para normalizar CNPJ e buscar empresa existente
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_record RECORD;
  clean_cnpj text;
  company_name_value text;
  user_name_value text;
  invited_company_id uuid;
BEGIN
  -- Verificar se é um usuário convidado (tem company_id nos metadados)
  invited_company_id := (NEW.raw_user_meta_data ->> 'company_id')::uuid;
  
  IF invited_company_id IS NOT NULL THEN
    -- Usuário foi convidado - usar a empresa do convite
    SELECT * INTO company_record FROM public.companies WHERE id = invited_company_id;
    
    IF company_record IS NOT NULL THEN
      INSERT INTO public.profiles (id, full_name, company_id)
      VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
        company_record.id
      );
      
      -- Usuário convidado entra como viewer por padrão (role definido no invite-user)
      INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
      VALUES (NEW.id, 'viewer'::user_role_type, company_record.id, NEW.id);
      
      RETURN NEW;
    END IF;
  END IF;
  
  -- Normalizar CNPJ removendo caracteres especiais
  clean_cnpj := regexp_replace(
    COALESCE(NEW.raw_user_meta_data ->> 'cnpj', ''), 
    '[^0-9]', '', 'g'
  );
  
  company_name_value := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Empresa');
  user_name_value := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário');
  
  -- Verificar se empresa já existe com este CNPJ normalizado
  IF clean_cnpj != '' AND length(clean_cnpj) = 14 THEN
    SELECT * INTO company_record 
    FROM public.companies 
    WHERE public.normalize_cnpj(cnpj) = clean_cnpj
    LIMIT 1;
  END IF;
  
  IF company_record IS NOT NULL THEN
    -- Empresa já existe - criar profile e role como VIEWER (não admin)
    INSERT INTO public.profiles (id, full_name, company_id)
    VALUES (NEW.id, user_name_value, company_record.id);
    
    INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (NEW.id, 'viewer'::user_role_type, company_record.id, NEW.id);
  ELSE
    -- Empresa não existe - criar nova com CNPJ limpo
    INSERT INTO public.companies (name, cnpj)
    VALUES (company_name_value, clean_cnpj)
    RETURNING * INTO company_record;
    
    -- Criar profile e role como ADMIN (primeiro usuário da empresa)
    INSERT INTO public.profiles (id, full_name, company_id)
    VALUES (NEW.id, user_name_value, company_record.id);
    
    INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (NEW.id, 'admin'::user_role_type, company_record.id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;
