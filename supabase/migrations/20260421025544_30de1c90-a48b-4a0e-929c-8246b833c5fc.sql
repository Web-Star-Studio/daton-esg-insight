CREATE OR REPLACE VIEW public.gabardo_federal_export AS
WITH org AS (
  SELECT p.company_id FROM profiles p JOIN auth.users u ON u.id=p.id
  WHERE u.email='jpbs@cesar.school' LIMIT 1
)
SELECT
  l.norm_type AS tipo,
  l.norm_number AS numero,
  l.publication_date AS data_pub,
  t.name AS tematica,
  st.name AS subtema,
  l.title AS titulo,
  l.summary AS resumo,
  l.full_text_url AS fonte,
  l.overall_applicability AS aplicabilidade_geral,
  l.overall_status AS status_geral,
  CASE WHEN l.general_notes IS NOT NULL AND TRIM(l.general_notes) != '' THEN 'sim' ELSE '' END AS tem_notes,
  CASE WHEN l.responsible_user_id IS NOT NULL THEN 'sim' ELSE '' END AS tem_responsavel,
  (SELECT COUNT(*) FROM legislation_unit_compliance uc WHERE uc.legislation_id = l.id) AS n_avaliacoes,
  MAX(CASE WHEN b.code = 'POA'             THEN public.uc_code(uc) END) AS poa,
  MAX(CASE WHEN b.code = 'PIR'             THEN public.uc_code(uc) END) AS pir,
  MAX(CASE WHEN b.code = 'GO-CARREGAMENTO' THEN public.uc_code(uc) END) AS go_carreg,
  MAX(CASE WHEN b.code = 'GO-FROTA'        THEN public.uc_code(uc) END) AS go_frota,
  MAX(CASE WHEN b.code = 'PREAL'           THEN public.uc_code(uc) END) AS preal,
  MAX(CASE WHEN b.code = 'SBC'             THEN public.uc_code(uc) END) AS sbc,
  MAX(CASE WHEN b.code = 'SJP'             THEN public.uc_code(uc) END) AS sjp,
  MAX(CASE WHEN b.code = 'DUQUE'           THEN public.uc_code(uc) END) AS duque,
  MAX(CASE WHEN b.code = 'IRA'             THEN public.uc_code(uc) END) AS ira,
  MAX(CASE WHEN b.code = 'PALHOÇA'         THEN public.uc_code(uc) END) AS palhoca,
  MAX(CASE WHEN b.code = 'CARIACICA'       THEN public.uc_code(uc) END) AS cariacica,
  MAX(CASE WHEN b.code = 'EUSÉBIO'         THEN public.uc_code(uc) END) AS eusebio,
  MAX(CASE WHEN b.code = 'CHUÍ'            THEN public.uc_code(uc) END) AS chui,
  MAX(CASE WHEN b.code = 'CAMAÇARI'        THEN public.uc_code(uc) END) AS camacari,
  MAX(CASE WHEN b.code = 'SUAPE'           THEN public.uc_code(uc) END) AS suape,
  MAX(CASE WHEN b.code = 'MATRIZ'          THEN public.uc_code(uc) END) AS matriz,
  ROW_NUMBER() OVER (ORDER BY l.norm_type, l.norm_number, l.id) AS rn
FROM legislations l
LEFT JOIN legislation_themes t     ON t.id  = l.theme_id
LEFT JOIN legislation_subthemes st ON st.id = l.subtheme_id
LEFT JOIN legislation_unit_compliance uc ON uc.legislation_id = l.id
LEFT JOIN branches b ON b.id = uc.branch_id
WHERE l.company_id = (SELECT company_id FROM org) AND l.jurisdiction = 'federal'
GROUP BY l.id, l.norm_type, l.norm_number, l.publication_date, t.name, st.name,
         l.title, l.summary, l.full_text_url, l.overall_applicability, l.overall_status,
         l.general_notes, l.responsible_user_id;