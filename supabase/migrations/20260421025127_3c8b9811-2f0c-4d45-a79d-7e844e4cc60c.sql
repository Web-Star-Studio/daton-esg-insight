CREATE OR REPLACE FUNCTION public.uc_code(uc public.legislation_unit_compliance) RETURNS text AS $$
  SELECT CASE
    WHEN uc.applicability = 'real'    AND uc.compliance_status = 'conforme'   THEN '2'
    WHEN uc.applicability = 'real'    AND uc.compliance_status = 'plano_acao' THEN '3'
    WHEN uc.applicability = 'na'      AND uc.compliance_status = 'na'         THEN '1'
    WHEN uc.applicability = 'pending' AND uc.compliance_status = 'pending'    THEN 'x'
    ELSE uc.applicability || '/' || uc.compliance_status
  END;
$$ LANGUAGE sql IMMUTABLE SET search_path = public;