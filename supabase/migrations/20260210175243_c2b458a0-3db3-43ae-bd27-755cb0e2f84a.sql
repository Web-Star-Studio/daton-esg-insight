
-- 1. Atualizar role para platform_admin
UPDATE user_roles 
SET role = 'platform_admin', updated_at = now()
WHERE user_id = 'ba36f039-23cc-49ec-ae9d-aa6e5a43c7f7';

-- 2. Inserir na tabela platform_admins
INSERT INTO platform_admins (user_id, email, full_name)
VALUES ('ba36f039-23cc-49ec-ae9d-aa6e5a43c7f7', 'contatodoug.a@gmail.com', 'Douglas Araújo')
ON CONFLICT DO NOTHING;
