-- Inserir categorias padrão para a empresa FIKE
INSERT INTO training_categories (name, description, company_id)
VALUES 
  ('Técnico', 'Categoria padrão', 'e50e7445-e38e-450a-8c51-fb5918b2faf3'),
  ('Gestão', 'Categoria padrão', 'e50e7445-e38e-450a-8c51-fb5918b2faf3'),
  ('Segurança', 'Categoria padrão', 'e50e7445-e38e-450a-8c51-fb5918b2faf3'),
  ('Compliance', 'Categoria padrão', 'e50e7445-e38e-450a-8c51-fb5918b2faf3'),
  ('Soft Skills', 'Categoria padrão', 'e50e7445-e38e-450a-8c51-fb5918b2faf3')
ON CONFLICT DO NOTHING;