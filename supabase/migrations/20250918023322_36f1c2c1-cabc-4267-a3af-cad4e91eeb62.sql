-- Atualizar políticas RLS para preenchimento automático do company_id

-- Para stakeholders
DROP POLICY IF EXISTS "Users can manage stakeholders from their company" ON public.stakeholders;

CREATE POLICY "Users can manage stakeholders from their company" ON public.stakeholders
    FOR ALL USING (company_id = get_user_company_id())
    WITH CHECK (company_id = get_user_company_id());

-- Para materiality_assessments
DROP POLICY IF EXISTS "Users can manage materiality assessments from their company" ON public.materiality_assessments;

CREATE POLICY "Users can manage materiality assessments from their company" ON public.materiality_assessments
    FOR ALL USING (company_id = get_user_company_id())
    WITH CHECK (company_id = get_user_company_id());

-- Criar função para preenchimento automático do company_id em stakeholders
CREATE OR REPLACE FUNCTION public.set_stakeholder_company_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para preenchimento automático do company_id em materiality_assessments
CREATE OR REPLACE FUNCTION public.set_assessment_company_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para preenchimento automático
CREATE TRIGGER stakeholder_set_company_id
    BEFORE INSERT ON public.stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_stakeholder_company_id();

CREATE TRIGGER assessment_set_company_id
    BEFORE INSERT ON public.materiality_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_assessment_company_id();