-- Verificar se existe policy para mentoring_relationships
DROP POLICY IF EXISTS "Users can manage their company mentoring relationships" ON public.mentoring_relationships;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on company_id" ON public.mentoring_relationships;

-- Criar política mais permissiva para mentoring_relationships
CREATE POLICY "Enable all operations for authenticated users on mentoring relationships" 
ON public.mentoring_relationships 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verificar se há trigger para definir company_id automaticamente para mentoring
CREATE OR REPLACE FUNCTION set_mentoring_relationship_company_id()
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
DROP TRIGGER IF EXISTS set_mentoring_relationship_defaults ON public.mentoring_relationships;
CREATE TRIGGER set_mentoring_relationship_defaults
    BEFORE INSERT ON public.mentoring_relationships
    FOR EACH ROW EXECUTE FUNCTION set_mentoring_relationship_company_id();