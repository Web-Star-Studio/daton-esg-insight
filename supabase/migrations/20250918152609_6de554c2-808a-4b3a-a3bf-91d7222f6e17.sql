-- Apenas inserir os temas de materialidade
INSERT INTO public.materiality_themes (code, title, description, gri_indicators, category, subcategory, sector_relevance, is_active) VALUES
('ENV001', 'Mudanças Climáticas', 'Impactos e riscos relacionados às mudanças climáticas', ARRAY['305-1', '305-2', '305-3', '305-4', '305-5'], 'environmental', 'Clima', ARRAY['all'], true),
('ENV002', 'Gestão de Resíduos', 'Geração, tratamento e destinação de resíduos', ARRAY['306-1', '306-2', '306-3', '306-4', '306-5'], 'environmental', 'Resíduos', ARRAY['all'], true),
('ENV003', 'Uso da Água', 'Consumo e gestão de recursos hídricos', ARRAY['303-1', '303-2', '303-3', '303-4', '303-5'], 'environmental', 'Água', ARRAY['all'], true),
('ENV004', 'Biodiversidade', 'Proteção e impactos na biodiversidade', ARRAY['304-1', '304-2', '304-3', '304-4'], 'environmental', 'Biodiversidade', ARRAY['all'], true),
('ENV005', 'Economia Circular', 'Práticas de economia circular e sustentabilidade', ARRAY['301-1', '301-2', '301-3'], 'environmental', 'Recursos', ARRAY['all'], true),
('SOC001', 'Saúde e Segurança', 'Saúde e segurança ocupacional dos trabalhadores', ARRAY['403-1', '403-2', '403-3', '403-4', '403-5', '403-6', '403-7', '403-8', '403-9', '403-10'], 'social', 'Trabalhadores', ARRAY['all'], true),
('SOC002', 'Diversidade e Inclusão', 'Diversidade, equidade e inclusão', ARRAY['405-1', '405-2'], 'social', 'Diversidade', ARRAY['all'], true),
('SOC003', 'Desenvolvimento de Talentos', 'Treinamento e desenvolvimento profissional', ARRAY['404-1', '404-2', '404-3'], 'social', 'Capacitação', ARRAY['all'], true),
('SOC004', 'Direitos Humanos', 'Respeito e promoção dos direitos humanos', ARRAY['410-1', '411-1', '412-1', '412-2', '412-3'], 'social', 'Direitos', ARRAY['all'], true),
('SOC005', 'Relacionamento com Comunidades', 'Impactos e engajamento com comunidades locais', ARRAY['413-1', '413-2'], 'social', 'Comunidade', ARRAY['all'], true),
('GOV001', 'Estrutura de Governança', 'Estrutura e composição dos órgãos de governança', ARRAY['2-9', '2-10', '2-11', '2-12'], 'governance', 'Estrutura', ARRAY['all'], true),
('GOV002', 'Ética e Integridade', 'Práticas éticas e combate à corrupção', ARRAY['2-15', '2-16', '2-17', '205-1', '205-2', '205-3'], 'governance', 'Ética', ARRAY['all'], true),
('GOV003', 'Transparência e Prestação de Contas', 'Transparência na comunicação e prestação de contas', ARRAY['2-2', '2-3', '2-4'], 'governance', 'Transparência', ARRAY['all'], true),
('ECO001', 'Performance Econômica', 'Desempenho econômico e criação de valor', ARRAY['201-1', '201-2', '201-3', '201-4'], 'economic', 'Performance', ARRAY['all'], true),
('ECO002', 'Presença no Mercado', 'Impactos econômicos nos mercados de atuação', ARRAY['202-1', '202-2'], 'economic', 'Mercado', ARRAY['all'], true)
ON CONFLICT (code) DO NOTHING;