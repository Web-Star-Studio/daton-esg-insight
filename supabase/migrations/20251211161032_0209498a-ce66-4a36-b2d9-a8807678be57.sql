-- Normalizar categorias ESG para português
UPDATE esg_risks SET esg_category = 'Ambiental' WHERE esg_category = 'Environmental';
UPDATE esg_risks SET esg_category = 'Governança' WHERE esg_category = 'Governance';
-- 'Social' já está correto, não precisa alterar