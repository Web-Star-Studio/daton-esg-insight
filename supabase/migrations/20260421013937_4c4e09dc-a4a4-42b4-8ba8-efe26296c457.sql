UPDATE legislations
SET responsible_user_id = 'c57fc156-3976-4e1d-b51e-e489a45629b1'
WHERE company_id=(SELECT p.company_id FROM profiles p JOIN auth.users u ON u.id=p.id WHERE u.email='jpbs@cesar.school' LIMIT 1)
  AND jurisdiction='federal'
  AND UPPER(TRIM(norm_type)) = 'LEI'
  AND REGEXP_REPLACE(COALESCE(norm_number,''),'[^0-9]','','g') = '12305'
  AND title ILIKE '%Política Nacional de Resíduos Sólidos%';