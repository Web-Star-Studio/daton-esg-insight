
-- Passo 3.2: Remover TODAS as legislações federais da Fike (reset completo)
-- CASCADE deleta as legislation_unit_compliance e legislation_evidences vinculadas.

DELETE FROM legislations
WHERE company_id = (
  SELECT p.company_id FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'joaopedrobatista010@gmail.com' LIMIT 1
) AND jurisdiction = 'federal';
