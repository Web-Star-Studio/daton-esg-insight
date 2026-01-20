-- =====================================================
-- FASE 1: Corrigir Políticas RLS - training_statuses
-- =====================================================

DROP POLICY IF EXISTS "Users can delete training statuses" ON training_statuses;
DROP POLICY IF EXISTS "Users can update training statuses" ON training_statuses;
DROP POLICY IF EXISTS "Users can view training statuses" ON training_statuses;
DROP POLICY IF EXISTS "Users can insert training statuses" ON training_statuses;

CREATE POLICY "Users can view training statuses"
ON training_statuses FOR SELECT
USING (company_id IS NULL OR company_id = get_user_company_id());

CREATE POLICY "Users can insert training statuses"
ON training_statuses FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update training statuses"
ON training_statuses FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete training statuses"
ON training_statuses FOR DELETE
USING (company_id = get_user_company_id());

-- =====================================================
-- FASE 2: Padronizar Políticas - training_categories
-- =====================================================

DROP POLICY IF EXISTS "Users can view training categories of their company" ON training_categories;
DROP POLICY IF EXISTS "Users can create training categories for their company" ON training_categories;
DROP POLICY IF EXISTS "Users can delete training categories of their company" ON training_categories;

CREATE POLICY "Users can view training categories"
ON training_categories FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert training categories"
ON training_categories FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update training categories"
ON training_categories FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete training categories"
ON training_categories FOR DELETE
USING (company_id = get_user_company_id());

-- =====================================================
-- FASE 3: Padronizar Políticas - training_documents
-- =====================================================

DROP POLICY IF EXISTS "Users can view training documents of their company" ON training_documents;
DROP POLICY IF EXISTS "Users can upload training documents for their company" ON training_documents;
DROP POLICY IF EXISTS "Users can delete training documents of their company" ON training_documents;

CREATE POLICY "Users can view training documents"
ON training_documents FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert training documents"
ON training_documents FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update training documents"
ON training_documents FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete training documents"
ON training_documents FOR DELETE
USING (company_id = get_user_company_id());

-- =====================================================
-- FASE 4: Padronizar Políticas - training_efficacy_evaluations
-- =====================================================

DROP POLICY IF EXISTS "Users can view training efficacy evaluations of their company" ON training_efficacy_evaluations;
DROP POLICY IF EXISTS "Users can create training efficacy evaluations for their company" ON training_efficacy_evaluations;
DROP POLICY IF EXISTS "Users can update training efficacy evaluations of their company" ON training_efficacy_evaluations;
DROP POLICY IF EXISTS "Users can delete training efficacy evaluations of their company" ON training_efficacy_evaluations;

CREATE POLICY "Users can view training efficacy evaluations"
ON training_efficacy_evaluations FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert training efficacy evaluations"
ON training_efficacy_evaluations FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update training efficacy evaluations"
ON training_efficacy_evaluations FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete training efficacy evaluations"
ON training_efficacy_evaluations FOR DELETE
USING (company_id = get_user_company_id());

-- =====================================================
-- FASE 5: Adicionar search_path às funções existentes
-- =====================================================

ALTER FUNCTION public.get_user_company_id() SET search_path = 'public';
ALTER FUNCTION public.user_has_company_access(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_platform_admin() SET search_path = 'public';
ALTER FUNCTION public.ensure_user_role() SET search_path = 'public';

-- =====================================================
-- FASE 6: Adicionar Índices de Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_training_programs_company_id 
ON training_programs(company_id);

CREATE INDEX IF NOT EXISTS idx_training_categories_company_id 
ON training_categories(company_id);

CREATE INDEX IF NOT EXISTS idx_training_documents_company_id 
ON training_documents(company_id);

CREATE INDEX IF NOT EXISTS idx_training_documents_program_id 
ON training_documents(training_program_id);

CREATE INDEX IF NOT EXISTS idx_employees_company_id 
ON employees(company_id);

CREATE INDEX IF NOT EXISTS idx_employee_trainings_employee_id 
ON employee_trainings(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_trainings_program_id 
ON employee_trainings(training_program_id);