-- ============================================
-- MIGRATION: Atualização de ODS e Pacto Global
-- Descrição: Adiciona campos para gerenciamento completo dos ODS
-- ============================================

-- 1. Adicionar novos campos à tabela sdg_alignment
ALTER TABLE sdg_alignment
ADD COLUMN IF NOT EXISTS selected_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS impact_level TEXT CHECK (impact_level IN ('Alto', 'Médio', 'Baixo')),
ADD COLUMN IF NOT EXISTS evidence_documents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sdg_alignment_report_sdg ON sdg_alignment(report_id, sdg_number);
CREATE INDEX IF NOT EXISTS idx_sdg_alignment_impact ON sdg_alignment(impact_level);
CREATE INDEX IF NOT EXISTS idx_sdg_alignment_updated ON sdg_alignment(updated_at DESC);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sdg_alignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sdg_alignment_timestamp ON sdg_alignment;
CREATE TRIGGER trigger_update_sdg_alignment_timestamp
BEFORE UPDATE ON sdg_alignment
FOR EACH ROW
EXECUTE FUNCTION update_sdg_alignment_timestamp();

-- 4. Criar tabela de biblioteca de ODS (cache)
CREATE TABLE IF NOT EXISTS sdg_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdg_number INTEGER NOT NULL UNIQUE CHECK (sdg_number BETWEEN 1 AND 17),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  global_pact_principles INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  theme TEXT CHECK (theme IN ('social', 'economic', 'environmental')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Popular tabela sdg_library com os 17 ODS
INSERT INTO sdg_library (sdg_number, name, short_name, color, icon, description, long_description, targets, global_pact_principles, theme) VALUES
(1, 'Erradicação da Pobreza', 'Pobreza Zero', '#E5243B', '🏘️', 
 'Acabar com a pobreza em todas as suas formas, em todos os lugares',
 'A pobreza vai além da falta de renda e recursos. Suas manifestações incluem fome, desnutrição, acesso limitado à educação e outros serviços básicos, discriminação social e exclusão.',
 '[
   {"code": "1.1", "description": "Até 2030, erradicar a pobreza extrema para todas as pessoas"},
   {"code": "1.2", "description": "Reduzir pelo menos à metade a proporção de pessoas que vivem na pobreza"},
   {"code": "1.3", "description": "Implementar sistemas de proteção social apropriados"},
   {"code": "1.4", "description": "Garantir direitos iguais aos recursos econômicos"},
   {"code": "1.5", "description": "Construir a resiliência dos pobres e vulneráveis"}
 ]'::jsonb,
 ARRAY[1, 2, 6],
 'social'),
 
(2, 'Fome Zero e Agricultura Sustentável', 'Fome Zero', '#DDA63A', '🌾',
 'Acabar com a fome, alcançar a segurança alimentar e promover a agricultura sustentável',
 'O setor alimentar e agrícola oferece soluções fundamentais para o desenvolvimento e é essencial para a erradicação da fome e da pobreza.',
 '[
   {"code": "2.1", "description": "Acabar com a fome e garantir o acesso a alimentos seguros"},
   {"code": "2.2", "description": "Acabar com todas as formas de desnutrição"},
   {"code": "2.3", "description": "Dobrar a produtividade agrícola"},
   {"code": "2.4", "description": "Garantir sistemas sustentáveis de produção de alimentos"},
   {"code": "2.5", "description": "Manter a diversidade genética"}
 ]'::jsonb,
 ARRAY[7, 8],
 'social'),

(3, 'Saúde e Bem-Estar', 'Saúde', '#4C9F38', '🏥',
 'Assegurar uma vida saudável e promover o bem-estar para todos',
 'Garantir uma vida saudável e promover o bem-estar para todos em todas as idades é essencial para o desenvolvimento sustentável.',
 '[
   {"code": "3.1", "description": "Reduzir a mortalidade materna"},
   {"code": "3.2", "description": "Acabar com mortes evitáveis de crianças"},
   {"code": "3.3", "description": "Combater epidemias"},
   {"code": "3.4", "description": "Reduzir mortalidade por doenças não transmissíveis"},
   {"code": "3.8", "description": "Atingir cobertura universal de saúde"}
 ]'::jsonb,
 ARRAY[1, 2],
 'social'),

(4, 'Educação de Qualidade', 'Educação', '#C5192D', '📚',
 'Assegurar educação inclusiva e de qualidade para todos',
 'A educação é chave para escapar da pobreza e promover mobilidade socioeconômica.',
 '[
   {"code": "4.1", "description": "Garantir educação gratuita e de qualidade"},
   {"code": "4.3", "description": "Acesso igualitário à educação superior"},
   {"code": "4.4", "description": "Aumentar competências para emprego"},
   {"code": "4.5", "description": "Eliminar disparidades de gênero"},
   {"code": "4.7", "description": "Promover desenvolvimento sustentável"}
 ]'::jsonb,
 ARRAY[1, 6],
 'social'),

(5, 'Igualdade de Gênero', 'Igualdade', '#FF3A21', '⚖️',
 'Alcançar igualdade de gênero e empoderar mulheres',
 'A igualdade de gênero é um direito fundamental e base para um mundo pacífico e próspero.',
 '[
   {"code": "5.1", "description": "Acabar com discriminação contra mulheres"},
   {"code": "5.2", "description": "Eliminar violência contra mulheres"},
   {"code": "5.4", "description": "Reconhecer trabalho de cuidado"},
   {"code": "5.5", "description": "Garantir participação plena e liderança"},
   {"code": "5.C", "description": "Adotar políticas de igualdade"}
 ]'::jsonb,
 ARRAY[1, 2, 6],
 'social'),

(6, 'Água Potável e Saneamento', 'Água Limpa', '#26BDE2', '💧',
 'Assegurar disponibilidade e gestão sustentável da água',
 'A água é essencial para a vida sustentável e precisa ser gerida de forma eficiente.',
 '[
   {"code": "6.1", "description": "Acesso universal à água potável"},
   {"code": "6.2", "description": "Acesso a saneamento adequado"},
   {"code": "6.3", "description": "Melhorar qualidade da água"},
   {"code": "6.4", "description": "Aumentar eficiência no uso da água"},
   {"code": "6.6", "description": "Proteger ecossistemas aquáticos"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(7, 'Energia Limpa e Acessível', 'Energia Limpa', '#FCC30B', '⚡',
 'Assegurar acesso à energia sustentável e moderna',
 'A energia é fundamental para quase todos os grandes desafios globais.',
 '[
   {"code": "7.1", "description": "Acesso universal a energia"},
   {"code": "7.2", "description": "Aumentar energias renováveis"},
   {"code": "7.3", "description": "Dobrar eficiência energética"},
   {"code": "7.A", "description": "Cooperação para energia limpa"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(8, 'Trabalho Decente e Crescimento Econômico', 'Trabalho Digno', '#A21942', '💼',
 'Promover crescimento econômico sustentado e trabalho decente',
 'Crescimento sustentável requer empregos de qualidade e condições dignas de trabalho.',
 '[
   {"code": "8.1", "description": "Crescimento econômico sustentado"},
   {"code": "8.2", "description": "Produtividade econômica"},
   {"code": "8.5", "description": "Emprego pleno e trabalho decente"},
   {"code": "8.7", "description": "Erradicar trabalho forçado"},
   {"code": "8.8", "description": "Proteger direitos trabalhistas"}
 ]'::jsonb,
 ARRAY[1, 2, 3, 4, 5, 6],
 'economic'),

(9, 'Indústria, Inovação e Infraestrutura', 'Inovação', '#FD6925', '🏗️',
 'Construir infraestrutura resiliente e promover inovação',
 'Infraestrutura e inovação são cruciais para o desenvolvimento sustentável.',
 '[
   {"code": "9.1", "description": "Desenvolver infraestrutura resiliente"},
   {"code": "9.2", "description": "Industrialização inclusiva"},
   {"code": "9.4", "description": "Modernizar infraestruturas"},
   {"code": "9.5", "description": "Fortalecer pesquisa científica"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'economic'),

(10, 'Redução das Desigualdades', 'Desigualdade', '#DD1367', '📊',
 'Reduzir desigualdades dentro e entre países',
 'Combater desigualdades é essencial para o desenvolvimento sustentável.',
 '[
   {"code": "10.1", "description": "Crescimento da renda dos 40% mais pobres"},
   {"code": "10.2", "description": "Promover inclusão social"},
   {"code": "10.3", "description": "Garantir igualdade de oportunidades"},
   {"code": "10.4", "description": "Adotar políticas de igualdade"}
 ]'::jsonb,
 ARRAY[1, 2, 6],
 'social'),

(11, 'Cidades e Comunidades Sustentáveis', 'Cidades Sustentáveis', '#FD9D24', '🏙️',
 'Tornar cidades inclusivas, seguras e sustentáveis',
 'Cidades sustentáveis são essenciais para o futuro da humanidade.',
 '[
   {"code": "11.1", "description": "Habitação segura e acessível"},
   {"code": "11.2", "description": "Sistemas de transporte sustentáveis"},
   {"code": "11.3", "description": "Urbanização sustentável"},
   {"code": "11.6", "description": "Reduzir impacto ambiental"},
   {"code": "11.7", "description": "Espaços públicos seguros"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(12, 'Consumo e Produção Responsáveis', 'Consumo Responsável', '#BF8B2E', '♻️',
 'Assegurar padrões sustentáveis de consumo e produção',
 'Fazer mais e melhor com menos é o objetivo do consumo sustentável.',
 '[
   {"code": "12.2", "description": "Gestão sustentável de recursos"},
   {"code": "12.3", "description": "Reduzir desperdício de alimentos"},
   {"code": "12.4", "description": "Manejo adequado de resíduos"},
   {"code": "12.5", "description": "Reduzir geração de resíduos"},
   {"code": "12.6", "description": "Práticas sustentáveis empresariais"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'economic'),

(13, 'Ação Contra a Mudança Global do Clima', 'Ação Climática', '#3F7E44', '🌍',
 'Combater mudança climática e seus impactos',
 'A mudança climática é um desafio global que requer ação urgente.',
 '[
   {"code": "13.1", "description": "Fortalecer resiliência climática"},
   {"code": "13.2", "description": "Integrar medidas climáticas"},
   {"code": "13.3", "description": "Educação sobre mudança climática"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(14, 'Vida na Água', 'Vida Aquática', '#0A97D9', '🐠',
 'Conservar oceanos, mares e recursos marinhos',
 'Os oceanos são essenciais para a vida no planeta.',
 '[
   {"code": "14.1", "description": "Reduzir poluição marinha"},
   {"code": "14.2", "description": "Proteger ecossistemas marinhos"},
   {"code": "14.3", "description": "Minimizar acidificação oceânica"},
   {"code": "14.4", "description": "Regular pesca"},
   {"code": "14.5", "description": "Conservar zonas costeiras"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(15, 'Vida Terrestre', 'Vida na Terra', '#56C02B', '🌳',
 'Proteger e promover uso sustentável de ecossistemas terrestres',
 'Florestas e biodiversidade são essenciais para o equilíbrio planetário.',
 '[
   {"code": "15.1", "description": "Conservar ecossistemas terrestres"},
   {"code": "15.2", "description": "Deter desmatamento"},
   {"code": "15.3", "description": "Combater desertificação"},
   {"code": "15.5", "description": "Reduzir perda de biodiversidade"}
 ]'::jsonb,
 ARRAY[7, 8, 9],
 'environmental'),

(16, 'Paz, Justiça e Instituições Eficazes', 'Paz e Justiça', '#00689D', '⚖️',
 'Promover sociedades pacíficas e instituições eficazes',
 'Paz, justiça e instituições fortes são fundamentais para o desenvolvimento.',
 '[
   {"code": "16.1", "description": "Reduzir violência"},
   {"code": "16.2", "description": "Acabar com abuso infantil"},
   {"code": "16.3", "description": "Promover Estado de Direito"},
   {"code": "16.5", "description": "Reduzir corrupção"},
   {"code": "16.6", "description": "Instituições eficazes e transparentes"}
 ]'::jsonb,
 ARRAY[1, 2, 10],
 'social'),

(17, 'Parcerias e Meios de Implementação', 'Parcerias', '#19486A', '🤝',
 'Fortalecer parcerias globais para desenvolvimento sustentável',
 'Parcerias são essenciais para alcançar todos os ODS.',
 '[
   {"code": "17.1", "description": "Mobilização de recursos"},
   {"code": "17.3", "description": "Recursos para países em desenvolvimento"},
   {"code": "17.6", "description": "Cooperação internacional"},
   {"code": "17.16", "description": "Parceria global"},
   {"code": "17.17", "description": "Parcerias público-privadas"}
 ]'::jsonb,
 ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
 'economic')

ON CONFLICT (sdg_number) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  targets = EXCLUDED.targets,
  global_pact_principles = EXCLUDED.global_pact_principles,
  theme = EXCLUDED.theme,
  updated_at = now();

-- 6. Criar índices na tabela sdg_library
CREATE INDEX IF NOT EXISTS idx_sdg_library_theme ON sdg_library(theme);
CREATE INDEX IF NOT EXISTS idx_sdg_library_number ON sdg_library(sdg_number);

-- 7. Adicionar comentários para documentação
COMMENT ON TABLE sdg_alignment IS 'Alinhamento de relatórios GRI com Objetivos de Desenvolvimento Sustentável';
COMMENT ON COLUMN sdg_alignment.selected_targets IS 'Array de códigos de metas selecionadas (ex: ["1.1", "1.3"])';
COMMENT ON COLUMN sdg_alignment.impact_level IS 'Nível de contribuição da organização: Alto, Médio ou Baixo';
COMMENT ON COLUMN sdg_alignment.evidence_documents IS 'URLs ou referências de documentos comprobatórios';
COMMENT ON COLUMN sdg_alignment.kpis IS 'Indicadores de progresso: [{indicator, baseline, target, current, unit}]';

COMMENT ON TABLE sdg_library IS 'Biblioteca de referência dos 17 ODS da Agenda 2030';
COMMENT ON COLUMN sdg_library.targets IS 'Array de metas específicas de cada ODS com códigos e descrições';
COMMENT ON COLUMN sdg_library.global_pact_principles IS 'Relação com os 10 princípios do Pacto Global da ONU';
COMMENT ON COLUMN sdg_library.theme IS 'Categoria temática: social, economic ou environmental';