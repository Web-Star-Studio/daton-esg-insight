-- Verificar se existe policy para career_development_plans
DROP POLICY IF EXISTS "Users can manage their company career development plans" ON public.career_development_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on company_id" ON public.career_development_plans;

-- Criar política mais permissiva para career_development_plans
CREATE POLICY "Enable all operations for authenticated users on career development plans" 
ON public.career_development_plans 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verificar se há trigger para definir company_id automaticamente
CREATE OR REPLACE FUNCTION set_career_plan_company_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Tentar obter company_id do usuário autenticado
    SELECT company_id INTO NEW.company_id
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Se não encontrou, usar o company_id fornecido
    IF NEW.company_id IS NULL THEN
        -- Manter o company_id que foi passado na requisição
        NULL;
    END IF;
    
    -- Definir created_by_user_id se não foi fornecido
    IF NEW.created_by_user_id IS NULL OR NEW.created_by_user_id = '' THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para definir company_id automaticamente
DROP TRIGGER IF EXISTS set_career_plan_defaults ON public.career_development_plans;
CREATE TRIGGER set_career_plan_defaults
    BEFORE INSERT ON public.career_development_plans
    FOR EACH ROW EXECUTE FUNCTION set_career_plan_company_id();