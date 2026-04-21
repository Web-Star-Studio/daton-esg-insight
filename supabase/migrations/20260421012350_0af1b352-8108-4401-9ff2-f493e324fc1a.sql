WITH org AS (
  SELECT p.company_id FROM profiles p JOIN auth.users u ON u.id=p.id
  WHERE u.email='jpbs@cesar.school' LIMIT 1
)
DELETE FROM legislations
WHERE company_id=(SELECT company_id FROM org)
  AND jurisdiction='federal'
  AND (
    (norm_type='Lei' AND norm_number='12.305/2010')
    OR (norm_type='Resolução' AND norm_number='237/1997')
  );