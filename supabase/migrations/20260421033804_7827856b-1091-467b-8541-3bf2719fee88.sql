CREATE OR REPLACE FUNCTION public.gabardo_federal_json_chunk(p_start int, p_len int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
BEGIN
  WITH org AS (
    SELECT p.company_id FROM profiles p JOIN auth.users u ON u.id=p.id
    WHERE u.email='jpbs@cesar.school' LIMIT 1
  ),
  agg AS (
    SELECT
      l.id,
      l.norm_type AS tipo,
      l.norm_number AS numero,
      l.publication_date AS data_pub,
      l.title AS titulo,
      CASE WHEN l.general_notes IS NOT NULL AND TRIM(l.general_notes) != '' THEN TRUE ELSE FALSE END AS tem_notes,
      CASE WHEN l.responsible_user_id IS NOT NULL THEN TRUE ELSE FALSE END AS tem_responsavel,
      COUNT(uc.id) AS n_avaliacoes,
      MAX(CASE WHEN b.code = 'POA'             THEN uc_code(uc) END) AS poa,
      MAX(CASE WHEN b.code = 'PIR'             THEN uc_code(uc) END) AS pir,
      MAX(CASE WHEN b.code = 'GO-CARREGAMENTO' THEN uc_code(uc) END) AS go_carreg,
      MAX(CASE WHEN b.code = 'GO-FROTA'        THEN uc_code(uc) END) AS go_frota,
      MAX(CASE WHEN b.code = 'PREAL'           THEN uc_code(uc) END) AS preal,
      MAX(CASE WHEN b.code = 'SBC'             THEN uc_code(uc) END) AS sbc,
      MAX(CASE WHEN b.code = 'SJP'             THEN uc_code(uc) END) AS sjp,
      MAX(CASE WHEN b.code = 'DUQUE'           THEN uc_code(uc) END) AS duque,
      MAX(CASE WHEN b.code = 'IRA'             THEN uc_code(uc) END) AS ira,
      MAX(CASE WHEN b.code = 'PALHOÇA'         THEN uc_code(uc) END) AS palhoca,
      MAX(CASE WHEN b.code = 'CARIACICA'       THEN uc_code(uc) END) AS cariacica,
      MAX(CASE WHEN b.code = 'EUSÉBIO'         THEN uc_code(uc) END) AS eusebio,
      MAX(CASE WHEN b.code = 'CHUÍ'            THEN uc_code(uc) END) AS chui,
      MAX(CASE WHEN b.code = 'CAMAÇARI'        THEN uc_code(uc) END) AS camacari,
      MAX(CASE WHEN b.code = 'SUAPE'           THEN uc_code(uc) END) AS suape,
      MAX(CASE WHEN b.code = 'MATRIZ'          THEN uc_code(uc) END) AS matriz
    FROM legislations l
    LEFT JOIN legislation_unit_compliance uc ON uc.legislation_id = l.id
    LEFT JOIN branches b ON b.id = uc.branch_id
    WHERE l.company_id = (SELECT company_id FROM org) AND l.jurisdiction = 'federal'
    GROUP BY l.id
  )
  SELECT json_agg(agg ORDER BY tipo, numero)::text INTO v_text FROM agg;
  RETURN substr(v_text, p_start, p_len);
END;
$$;