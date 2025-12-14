-- Políticas RLS para employee_experiences
CREATE POLICY "Users can view employee experiences from their company"
ON public.employee_experiences
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert employee experiences for their company"
ON public.employee_experiences
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update employee experiences from their company"
ON public.employee_experiences
FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete employee experiences from their company"
ON public.employee_experiences
FOR DELETE
USING (company_id = get_user_company_id());

-- Políticas RLS para employee_education
CREATE POLICY "Users can view employee education from their company"
ON public.employee_education
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert employee education for their company"
ON public.employee_education
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update employee education from their company"
ON public.employee_education
FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete employee education from their company"
ON public.employee_education
FOR DELETE
USING (company_id = get_user_company_id());