-- Popular biblioteca de indicadores GRI com indicadores essenciais

INSERT INTO public.gri_indicators_library (code, title, description, indicator_type, data_type, unit, gri_standard, is_mandatory, guidance_text, calculation_method) VALUES 

-- GRI 2: Divulgações Gerais (Universais - Obrigatórias)
('GRI 2-1', 'Detalhes organizacionais', 'Nome da organização, natureza das atividades e produtos e/ou serviços, localização da sede, países de operação', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Forneça informações básicas sobre a organização incluindo nome legal, natureza das atividades, localização da sede e países onde opera.', 'Informações descritivas baseadas em registros oficiais'),

('GRI 2-2', 'Entidades incluídas no relatório de sustentabilidade', 'Lista de entidades incluídas nas demonstrações financeiras consolidadas e se alguma entidade não está incluída no relatório de sustentabilidade', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Especifique quais entidades estão incluídas no relatório e explique diferenças entre o relatório financeiro e de sustentabilidade.', 'Comparação entre entidades do relatório financeiro vs sustentabilidade'),

('GRI 2-3', 'Período do relatório, frequência e ponto de contato', 'Período coberto pelo relatório, frequência de publicação e ponto de contato para perguntas sobre o relatório', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Defina claramente o período coberto, quando o relatório é publicado e como entrar em contato para questões.', 'Informações administrativas do processo de relatório'),

('GRI 2-4', 'Reformulações de informações', 'Reformulações de informações fornecidas em relatórios anteriores e os motivos para tais reformulações', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Explique quaisquer mudanças em dados reportados anteriormente e justifique os motivos.', 'Comparação com relatórios anteriores e justificativas para alterações'),

('GRI 2-5', 'Verificação externa', 'Política e prática atual para buscar verificação externa para o relatório', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Descreva se o relatório passa por verificação externa e qual o escopo dessa verificação.', 'Informações sobre processo de auditoria/verificação externa'),

-- GRI 2: Atividades e trabalhadores
('GRI 2-6', 'Atividades, cadeia de valor e outras relações de negócios', 'Setores em que a organização está ativa, cadeia de valor e outras relações de negócios', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Descreva os setores de atuação, principais elementos da cadeia de valor e relações comerciais significativas.', 'Mapeamento da cadeia de valor e relacionamentos comerciais'),

('GRI 2-7', 'Empregados', 'Número total de empregados e detalhamento por gênero, região, tipo de contrato', 'Universal', 'Numérico', 'funcionários', 'GRI 2', true, 'Forneça números totais e breakdown de empregados por diferentes categorias.', 'Contagem de funcionários por categoria no final do período reportado'),

('GRI 2-8', 'Trabalhadores que não são empregados', 'Número total de trabalhadores que não são empregados', 'Universal', 'Numérico', 'trabalhadores', 'GRI 2', false, 'Reporte trabalhadores terceirizados, temporários e outros que não são empregados diretos.', 'Contagem de trabalhadores não empregados no final do período'),

-- GRI 2: Governança
('GRI 2-9', 'Estrutura de governança e composição', 'Estrutura de governança, composição do mais alto órgão de governança', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Descreva a estrutura de governança incluindo comitês e composição do conselho.', 'Descrição da estrutura organizacional de governança'),

('GRI 2-10', 'Nomeação e seleção do mais alto órgão de governança', 'Processos de nomeação e seleção para o mais alto órgão de governança e seus comitês', 'Universal', 'Texto', NULL, 'GRI 2', false, 'Explique como são selecionados os membros do mais alto órgão de governança.', 'Descrição dos processos de seleção e nomeação'),

-- GRI 2: Estratégia, políticas e práticas  
('GRI 2-22', 'Declaração sobre a estratégia de desenvolvimento sustentável', 'Declaração do mais alto executivo sobre a relevância da sustentabilidade e estratégia da organização', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Inclua uma declaração do CEO ou presidente sobre sustentabilidade e estratégia.', 'Carta da liderança sobre compromissos de sustentabilidade'),

('GRI 2-23', 'Compromissos de políticas', 'Compromissos de políticas para conduta empresarial responsável', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Descreva políticas e compromissos relacionados à conduta empresarial responsável.', 'Descrição de políticas de sustentabilidade e conduta ética'),

-- GRI 2: Engajamento de stakeholders
('GRI 2-29', 'Abordagem para o engajamento de stakeholders', 'Abordagem para engajar stakeholders', 'Universal', 'Texto', NULL, 'GRI 2', true, 'Descreva como a organização identifica e engaja com stakeholders.', 'Metodologia de identificação e engajamento de partes interessadas'),

-- GRI 3: Temas Materiais (Obrigatórias)
('GRI 3-1', 'Processo para determinar temas materiais', 'Processo seguido para determinar temas materiais', 'Universal', 'Texto', NULL, 'GRI 3', true, 'Descreva o processo usado para identificar e avaliar temas materiais.', 'Metodologia de avaliação de materialidade'),

('GRI 3-2', 'Lista de temas materiais', 'Lista de temas materiais identificados', 'Universal', 'Texto', NULL, 'GRI 3', true, 'Forneça uma lista completa dos temas materiais identificados no processo de avaliação.', 'Lista de temas considerados materiais para o negócio'),

-- GRI 300: Indicadores Ambientais Essenciais
('GRI 302-1', 'Consumo de energia dentro da organização', 'Total de combustível consumido, energia elétrica, aquecimento, refrigeração e vapor', 'Ambiental', 'Numérico', 'GJ', 'GRI 302', false, 'Reporte todo consumo energético interno incluindo combustíveis fósseis, eletricidade e outras formas de energia.', 'Somatória de todas as formas de energia consumidas internamente'),

('GRI 302-2', 'Consumo de energia fora da organização', 'Consumo de energia fora da organização', 'Ambiental', 'Numérico', 'GJ', 'GRI 302', false, 'Reporte consumo energético em atividades terceirizadas ou na cadeia de valor.', 'Energia consumida em atividades terceirizadas'),

('GRI 302-3', 'Intensidade energética', 'Razão de intensidade energética', 'Ambiental', 'Numérico', 'GJ/unidade', 'GRI 302', false, 'Calcule a intensidade energética usando uma métrica específica da organização.', 'Total de energia dividido por métrica específica (receita, produção, etc.)'),

('GRI 305-1', 'Emissões diretas de GEE (Escopo 1)', 'Emissões diretas de gases de efeito estufa em toneladas métricas de CO2 equivalente', 'Ambiental', 'Numérico', 'tCO2e', 'GRI 305', false, 'Reporte todas as emissões diretas de GEE da organização (Escopo 1 do GHG Protocol).', 'Somatória de emissões diretas de todas as fontes controladas'),

('GRI 305-2', 'Emissões indiretas de GEE relacionadas à energia (Escopo 2)', 'Emissões indiretas de GEE do consumo de energia em toneladas métricas de CO2 equivalente', 'Ambiental', 'Numérico', 'tCO2e', 'GRI 305', false, 'Reporte emissões indiretas de energia adquirida (Escopo 2 do GHG Protocol).', 'Emissões de eletricidade, aquecimento/resfriamento adquiridos'),

('GRI 305-3', 'Outras emissões indiretas de GEE (Escopo 3)', 'Outras emissões indiretas de gases de efeito estufa em toneladas métricas de CO2 equivalente', 'Ambiental', 'Numérico', 'tCO2e', 'GRI 305', false, 'Reporte outras emissões indiretas na cadeia de valor (Escopo 3 do GHG Protocol).', 'Emissões em atividades terceirizadas e cadeia de valor'),

('GRI 303-3', 'Retirada de água', 'Retirada total de água por fonte', 'Ambiental', 'Numérico', 'm³', 'GRI 303', false, 'Reporte toda água retirada por fonte (superficial, subterrânea, etc.).', 'Volume total de água retirada por tipo de fonte'),

('GRI 306-3', 'Resíduos gerados', 'Peso total de resíduos gerados e detalhamento por composição', 'Ambiental', 'Numérico', 't', 'GRI 306', false, 'Reporte peso total de resíduos gerados por tipo e método de tratamento.', 'Peso de resíduos gerados por categoria e destinação'),

-- GRI 400: Indicadores Sociais Essenciais  
('GRI 401-1', 'Novas contratações e rotatividade de empregados', 'Taxa e número total de novas contratações e rotatividade por faixa etária, gênero e região', 'Social', 'Numérico', '%', 'GRI 401', false, 'Reporte contratações e desligamentos detalhados por categoria demográfica.', 'Número e taxa de contratações/desligamentos por categoria'),

('GRI 403-9', 'Lesões relacionadas ao trabalho', 'Tipos e taxas de lesões, doenças ocupacionais, dias perdidos, absenteísmo e óbitos', 'Social', 'Numérico', 'taxa', 'GRI 403', false, 'Reporte todas as estatísticas de segurança e saúde ocupacional.', 'Taxas calculadas por horas trabalhadas ou número de funcionários'),

('GRI 404-1', 'Média de horas de capacitação por ano, por empregado', 'Média de horas de capacitação por empregado por gênero e categoria funcional', 'Social', 'Numérico', 'horas', 'GRI 404', false, 'Calcule horas médias de treinamento por categoria de funcionário.', 'Total de horas de treinamento dividido por número de funcionários'),

('GRI 405-1', 'Diversidade em órgãos de governança e empregados', 'Composição de órgãos de governança e empregados por categoria de diversidade', 'Social', 'Percentual', '%', 'GRI 405', false, 'Reporte composição por gênero, faixa etária e outros indicadores de diversidade.', 'Percentual por categoria de diversidade em cada nível organizacional'),

-- GRI 200: Indicadores Econômicos Essenciais
('GRI 201-1', 'Valor econômico direto gerado e distribuído', 'Valor econômico direto gerado e distribuído incluindo receitas, custos, salários, doações', 'Econômico', 'Numérico', 'R$', 'GRI 201', false, 'Demonstre como valor econômico é gerado e distribuído entre stakeholders.', 'Cálculo baseado em demonstrações financeiras auditadas'),

('GRI 201-2', 'Implicações financeiras e outros riscos e oportunidades devido às mudanças climáticas', 'Riscos e oportunidades financeiras devido às mudanças climáticas', 'Econômico', 'Texto', NULL, 'GRI 201', false, 'Descreva riscos e oportunidades financeiras relacionadas às mudanças climáticas.', 'Análise qualitativa e quantitativa de riscos climáticos'),

('GRI 205-2', 'Comunicação e capacitação sobre políticas e procedimentos de combate à corrupção', 'Número e percentual de funcionários comunicados/capacitados sobre anticorrupção', 'Econômico', 'Percentual', '%', 'GRI 205', false, 'Reporte capacitações e comunicações sobre políticas anticorrupção.', 'Percentual de funcionários que receberam comunicação/treinamento');