-- Criar política para permitir usuários gerenciarem filiais da sua empresa
CREATE POLICY "Users can manage their company branches"
ON public.branches
FOR ALL
USING (
  (company_id = get_user_company_id()) 
  OR user_has_company_access(company_id) 
  OR (
    (auth.uid() IS NOT NULL) 
    AND (EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    ))
  )
)
WITH CHECK (
  (company_id = get_user_company_id()) 
  OR user_has_company_access(company_id) 
  OR (
    (auth.uid() IS NOT NULL) 
    AND (EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    ))
  )
);