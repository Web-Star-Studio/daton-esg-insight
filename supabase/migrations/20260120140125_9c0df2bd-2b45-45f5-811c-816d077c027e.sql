-- =====================================================
-- FASE 1: Corrigir usuário órfão (sem role)
-- =====================================================

INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
SELECT 
  'b7b219a5-44cd-4486-8a83-197142740019',
  'admin',
  '27e673fe-e269-4029-aa20-f937778712d1',
  'b7b219a5-44cd-4486-8a83-197142740019'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = 'b7b219a5-44cd-4486-8a83-197142740019'
);

-- =====================================================
-- FASE 2: Trigger para garantir role em novos usuários
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o usuário tem company_id mas não tem role, adicionar role padrão 'viewer'
  IF NEW.company_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (NEW.id, 'viewer', NEW.company_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger apenas se não existir
DROP TRIGGER IF EXISTS on_profile_created_ensure_role ON profiles;
CREATE TRIGGER on_profile_created_ensure_role
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_user_role();

-- =====================================================
-- FASE 3: Padronizar políticas RLS críticas
-- Atualizar tabelas mais importantes para usar get_user_company_id()
-- =====================================================

-- accounting_entries
DROP POLICY IF EXISTS "Users can view their company entries" ON accounting_entries;
CREATE POLICY "Users can view their company entries" ON accounting_entries 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company entries" ON accounting_entries;
CREATE POLICY "Users can insert their company entries" ON accounting_entries 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company entries" ON accounting_entries;
CREATE POLICY "Users can update their company entries" ON accounting_entries 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company entries" ON accounting_entries;
CREATE POLICY "Users can delete their company entries" ON accounting_entries 
FOR DELETE USING (company_id = get_user_company_id());

-- accounts_payable
DROP POLICY IF EXISTS "Users can view their company accounts payable" ON accounts_payable;
CREATE POLICY "Users can view their company accounts payable" ON accounts_payable 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company accounts payable" ON accounts_payable;
CREATE POLICY "Users can insert their company accounts payable" ON accounts_payable 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company accounts payable" ON accounts_payable;
CREATE POLICY "Users can update their company accounts payable" ON accounts_payable 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company accounts payable" ON accounts_payable;
CREATE POLICY "Users can delete their company accounts payable" ON accounts_payable 
FOR DELETE USING (company_id = get_user_company_id());

-- accounts_receivable
DROP POLICY IF EXISTS "Users can view their company accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can view their company accounts receivable" ON accounts_receivable 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can insert their company accounts receivable" ON accounts_receivable 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can update their company accounts receivable" ON accounts_receivable 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can delete their company accounts receivable" ON accounts_receivable 
FOR DELETE USING (company_id = get_user_company_id());

-- bank_accounts
DROP POLICY IF EXISTS "Users can view their company bank accounts" ON bank_accounts;
CREATE POLICY "Users can view their company bank accounts" ON bank_accounts 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company bank accounts" ON bank_accounts;
CREATE POLICY "Users can insert their company bank accounts" ON bank_accounts 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company bank accounts" ON bank_accounts;
CREATE POLICY "Users can update their company bank accounts" ON bank_accounts 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company bank accounts" ON bank_accounts;
CREATE POLICY "Users can delete their company bank accounts" ON bank_accounts 
FOR DELETE USING (company_id = get_user_company_id());

-- cost_centers
DROP POLICY IF EXISTS "Users can view their company cost centers" ON cost_centers;
CREATE POLICY "Users can view their company cost centers" ON cost_centers 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company cost centers" ON cost_centers;
CREATE POLICY "Users can insert their company cost centers" ON cost_centers 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company cost centers" ON cost_centers;
CREATE POLICY "Users can update their company cost centers" ON cost_centers 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company cost centers" ON cost_centers;
CREATE POLICY "Users can delete their company cost centers" ON cost_centers 
FOR DELETE USING (company_id = get_user_company_id());

-- projects
DROP POLICY IF EXISTS "Users can view their company projects" ON projects;
CREATE POLICY "Users can view their company projects" ON projects 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company projects" ON projects;
CREATE POLICY "Users can insert their company projects" ON projects 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company projects" ON projects;
CREATE POLICY "Users can update their company projects" ON projects 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company projects" ON projects;
CREATE POLICY "Users can delete their company projects" ON projects 
FOR DELETE USING (company_id = get_user_company_id());

-- suppliers
DROP POLICY IF EXISTS "Users can view their company suppliers" ON suppliers;
CREATE POLICY "Users can view their company suppliers" ON suppliers 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company suppliers" ON suppliers;
CREATE POLICY "Users can insert their company suppliers" ON suppliers 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company suppliers" ON suppliers;
CREATE POLICY "Users can update their company suppliers" ON suppliers 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company suppliers" ON suppliers;
CREATE POLICY "Users can delete their company suppliers" ON suppliers 
FOR DELETE USING (company_id = get_user_company_id());

-- assets
DROP POLICY IF EXISTS "Users can view their company assets" ON assets;
CREATE POLICY "Users can view their company assets" ON assets 
FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can insert their company assets" ON assets;
CREATE POLICY "Users can insert their company assets" ON assets 
FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update their company assets" ON assets;
CREATE POLICY "Users can update their company assets" ON assets 
FOR UPDATE USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can delete their company assets" ON assets;
CREATE POLICY "Users can delete their company assets" ON assets 
FOR DELETE USING (company_id = get_user_company_id());