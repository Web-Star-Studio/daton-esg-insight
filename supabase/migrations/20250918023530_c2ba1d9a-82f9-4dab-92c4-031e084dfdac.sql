-- Corrigir avisos de segurança das funções

-- Corrigir função set_stakeholder_company_id
CREATE OR REPLACE FUNCTION public.set_stakeholder_company_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir função set_assessment_company_id
CREATE OR REPLACE FUNCTION public.set_assessment_company_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;