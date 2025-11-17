-- Etapa 1: Criar Foreign Key entre action_plan_items e action_plans
ALTER TABLE action_plan_items
ADD CONSTRAINT action_plan_items_action_plan_id_fkey
FOREIGN KEY (action_plan_id)
REFERENCES action_plans(id)
ON DELETE CASCADE;

-- Etapa 2: Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_action_plan_items_action_plan_id
ON action_plan_items(action_plan_id);

-- Etapa 5: Verificar e criar política RLS se necessário
-- Primeiro, verificar se a política já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'action_plan_items' 
    AND policyname = 'Users can view items from their company'
  ) THEN
    CREATE POLICY "Users can view items from their company"
    ON action_plan_items FOR SELECT
    USING (
      action_plan_id IN (
        SELECT id FROM action_plans 
        WHERE company_id = get_user_company_id()
      )
    );
  END IF;
END $$;