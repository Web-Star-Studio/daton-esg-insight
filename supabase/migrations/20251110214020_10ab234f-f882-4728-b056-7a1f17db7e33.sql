-- Tabela de templates de seções de relatório
CREATE TABLE IF NOT EXISTS public.report_section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  description TEXT,
  
  -- Estrutura do template
  required_data_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  subsections JSONB DEFAULT '[]'::jsonb,
  
  -- Configuração de geração
  ai_prompt_template TEXT,
  visual_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os 10 templates principais
INSERT INTO public.report_section_templates (template_key, template_name, category, section_order, description, required_data_sources, subsections, visual_types) VALUES
(
  'vision_sustainability_strategy',
  '1. Visão e Estratégia de Sustentabilidade',
  'strategy',
  1,
  'Missão ESG, alinhamento com ODS, metas de sustentabilidade, análise de materialidade e estrutura de governança ESG',
  ARRAY['goals', 'sdg_alignment', 'materiality_matrix'],
  '[
    {"key": "mission_values", "title": "Missão e Valores ESG", "type": "text", "required": true},
    {"key": "sdg_alignment", "title": "Alinhamento com ODS", "type": "text+visuals", "required": true},
    {"key": "esg_targets", "title": "Metas e Compromissos", "type": "table", "required": true},
    {"key": "materiality", "title": "Análise de Materialidade", "type": "matrix", "required": true}
  ]'::jsonb,
  ARRAY['bar_chart', 'table', 'matrix', 'icons']
),
(
  'corporate_governance',
  '2. Governança Corporativa',
  'governance',
  2,
  'Estrutura de governança, políticas corporativas, treinamentos em ética e canal de denúncias',
  ARRAY['training_programs'],
  '[
    {"key": "governance_structure", "title": "Estrutura de Governança", "type": "text", "required": true},
    {"key": "policies", "title": "Políticas e Códigos", "type": "list", "required": true},
    {"key": "ethics_training", "title": "Treinamentos em Ética", "type": "text+chart", "required": true}
  ]'::jsonb,
  ARRAY['pie_chart', 'bar_chart', 'table']
),
(
  'environmental_management',
  '3. Gestão Ambiental',
  'environmental',
  3,
  'Sistema de gestão ambiental, consumo de energia, água, gestão de resíduos e emissões de GEE',
  ARRAY['emissions', 'energy_consumption', 'water_consumption', 'waste_logs'],
  '[
    {"key": "management_system", "title": "Sistema de Gestão Ambiental", "type": "text", "required": true},
    {"key": "energy", "title": "Consumo de Energia", "type": "text+chart", "required": true},
    {"key": "water", "title": "Consumo de Água", "type": "text+chart", "required": true},
    {"key": "waste", "title": "Gestão de Resíduos", "type": "text+chart", "required": true},
    {"key": "emissions", "title": "Emissões de GEE", "type": "text+chart", "required": true}
  ]'::jsonb,
  ARRAY['line_chart', 'bar_chart', 'pie_chart', 'table']
),
(
  'social_performance',
  '4. Desempenho Social',
  'social',
  4,
  'Força de trabalho, diversidade, treinamentos, saúde e segurança (LTIFR, TRIR)',
  ARRAY['employees', 'training_programs', 'safety_incidents'],
  '[
    {"key": "workforce", "title": "Força de Trabalho", "type": "text+chart", "required": true},
    {"key": "diversity", "title": "Diversidade e Inclusão", "type": "text+chart", "required": true},
    {"key": "training", "title": "Treinamento e Desenvolvimento", "type": "text+chart", "required": true},
    {"key": "health_safety", "title": "Saúde e Segurança", "type": "text+chart", "required": true}
  ]'::jsonb,
  ARRAY['bar_chart', 'pie_chart', 'line_chart', 'table']
),
(
  'economic_performance',
  '5. Gestão e Desempenho Econômico',
  'economic',
  5,
  'Valor econômico gerado e distribuído, investimentos ESG, receita de produtos sustentáveis',
  ARRAY['financial_data'],
  '[
    {"key": "economic_value", "title": "Valor Econômico Gerado", "type": "text+chart", "required": true},
    {"key": "esg_investments", "title": "Investimentos ESG", "type": "text+chart", "required": true}
  ]'::jsonb,
  ARRAY['bar_chart', 'table']
),
(
  'stakeholder_engagement',
  '6. Relacionamento com Stakeholders',
  'stakeholders',
  6,
  'Mapeamento de stakeholders, consultas realizadas, pesquisas de satisfação',
  ARRAY['stakeholder_mapping'],
  '[
    {"key": "mapping", "title": "Mapeamento de Stakeholders", "type": "text", "required": true},
    {"key": "engagement", "title": "Ações de Engajamento", "type": "text+table", "required": true}
  ]'::jsonb,
  ARRAY['bar_chart', 'table']
),
(
  'innovation_technology',
  '7. Inovação e Desenvolvimento Tecnológico',
  'innovation',
  7,
  'Investimentos em P&D, parcerias para inovação, reduções de impacto por tecnologia',
  ARRAY['innovation_data'],
  '[
    {"key": "rd_investments", "title": "Investimentos em P&D", "type": "text+chart", "required": true},
    {"key": "partnerships", "title": "Parcerias e Colaborações", "type": "text+list", "required": true}
  ]'::jsonb,
  ARRAY['line_chart', 'bar_chart', 'table']
),
(
  'reporting_standards',
  '8. Relatórios e Normas',
  'reporting',
  8,
  'Frameworks adotados (GRI, SASB, TCFD), escopo do relatório, metodologia de cálculo',
  ARRAY['gri_indicators'],
  '[
    {"key": "frameworks", "title": "Frameworks Adotados", "type": "text+list", "required": true},
    {"key": "scope", "title": "Escopo do Relatório", "type": "text", "required": true},
    {"key": "methodology", "title": "Metodologia de Cálculo", "type": "text", "required": true}
  ]'::jsonb,
  ARRAY['icons', 'table']
),
(
  'communication_transparency',
  '9. Comunicação e Transparência',
  'communication',
  9,
  'Canais de comunicação, publicações ESG, compromissos públicos',
  ARRAY['communication_channels'],
  '[
    {"key": "channels", "title": "Canais de Comunicação", "type": "text+list", "required": true},
    {"key": "publications", "title": "Publicações ESG", "type": "text+table", "required": true}
  ]'::jsonb,
  ARRAY['icons', 'table']
),
(
  'audits_assessments',
  '10. Auditorias e Avaliações',
  'audits',
  10,
  'Auditorias realizadas, conformidades, não conformidades e planos de ação',
  ARRAY['audits', 'non_conformities'],
  '[
    {"key": "audits", "title": "Auditorias Realizadas", "type": "text+table", "required": true},
    {"key": "conformities", "title": "Status de Conformidades", "type": "text+chart", "required": true}
  ]'::jsonb,
  ARRAY['table', 'bar_chart']
);

-- Tabela de seções geradas
CREATE TABLE IF NOT EXISTS public.report_generated_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.gri_reports(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.report_section_templates(id),
  
  -- Conteúdo gerado
  section_content JSONB DEFAULT '{}'::jsonb,
  generated_text TEXT,
  generated_visuals JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados de geração
  data_sources_used TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  generation_timestamp TIMESTAMPTZ,
  last_data_refresh TIMESTAMPTZ,
  
  -- Controle de edição
  manually_edited BOOLEAN DEFAULT false,
  editor_notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_report_section_templates_category ON public.report_section_templates(category);
CREATE INDEX idx_report_section_templates_order ON public.report_section_templates(section_order);
CREATE INDEX idx_report_generated_sections_report ON public.report_generated_sections(report_id);
CREATE INDEX idx_report_generated_sections_template ON public.report_generated_sections(template_id);

-- RLS Policies
ALTER TABLE public.report_section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_generated_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
  ON public.report_section_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can view their company's generated sections"
  ON public.report_generated_sections FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM public.gri_reports 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their company's generated sections"
  ON public.report_generated_sections FOR ALL
  USING (
    report_id IN (
      SELECT id FROM public.gri_reports 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_report_generated_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_report_generated_sections_updated_at
BEFORE UPDATE ON public.report_generated_sections
FOR EACH ROW
EXECUTE FUNCTION update_report_generated_sections_updated_at();

-- Comentários
COMMENT ON TABLE public.report_section_templates IS 'Templates de seções estruturadas de relatórios de sustentabilidade';
COMMENT ON TABLE public.report_generated_sections IS 'Seções de relatório geradas automaticamente com IA e dados do sistema';