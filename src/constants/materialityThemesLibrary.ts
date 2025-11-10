/**
 * Biblioteca Completa de Temas de Materialidade ESG
 * Baseada em GRI Standards e adaptada para o contexto brasileiro
 */

export interface MaterialityMetric {
  code: string;
  name: string;
  unit: string;
  description: string;
  gri_reference?: string;
}

export interface MaterialityThemeDetail {
  id: string;
  code: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  subcategory: string;
  description: string;
  detailed_description: string;
  brazilian_relevance: string;
  metrics: MaterialityMetric[];
  gri_standards: string[];
  related_sdgs: number[];
  stakeholders_impacted: string[];
  example_actions: string[];
  icon: string;
  color: string;
}

export const MATERIALITY_THEMES_LIBRARY: MaterialityThemeDetail[] = [
  // =====================
  // TEMAS AMBIENTAIS (E)
  // =====================
  {
    id: 'env-01',
    code: 'ENV-001',
    name: 'Descarbonização e Emissões de GEE',
    category: 'environmental',
    subcategory: 'Mudanças Climáticas',
    description: 'Gestão e redução de emissões de gases de efeito estufa',
    detailed_description: 'Monitoramento e redução de emissões diretas (Scope 1), indiretas de energia (Scope 2) e outras indiretas (Scope 3). Inclui estratégias de descarbonização, precificação de carbono e transição para economia de baixo carbono.',
    brazilian_relevance: 'Crítico devido à Política Nacional sobre Mudança do Clima (PNMC) e compromissos do Brasil no Acordo de Paris. Setor agropecuário representa 74% das emissões nacionais.',
    metrics: [
      {
        code: 'GEE-001',
        name: 'Emissões Scope 1',
        unit: 'tCO₂e',
        description: 'Emissões diretas de fontes controladas pela organização',
        gri_reference: 'GRI 305-1'
      },
      {
        code: 'GEE-002',
        name: 'Emissões Scope 2',
        unit: 'tCO₂e',
        description: 'Emissões indiretas da geração de energia adquirida',
        gri_reference: 'GRI 305-2'
      },
      {
        code: 'GEE-003',
        name: 'Emissões Scope 3',
        unit: 'tCO₂e',
        description: 'Outras emissões indiretas da cadeia de valor',
        gri_reference: 'GRI 305-3'
      },
      {
        code: 'GEE-004',
        name: 'Intensidade de Carbono',
        unit: 'tCO₂e/R$ milhão',
        description: 'Emissões por unidade de receita',
        gri_reference: 'GRI 305-4'
      },
      {
        code: 'GEE-005',
        name: 'Meta de Redução',
        unit: '%',
        description: 'Percentual de redução de emissões comprometido',
        gri_reference: 'GRI 305-5'
      }
    ],
    gri_standards: ['GRI 305: Emissões'],
    related_sdgs: [13, 7, 12],
    stakeholders_impacted: ['Investidores', 'Governo', 'Comunidades', 'Clientes'],
    example_actions: [
      'Inventário de emissões seguindo GHG Protocol',
      'Metas Science Based Targets (SBTi)',
      'Compensação via créditos de carbono',
      'Eficiência energética operacional'
    ],
    icon: '🌡️',
    color: '#10b981'
  },
  {
    id: 'env-02',
    code: 'ENV-002',
    name: 'Biodiversidade e Bioeconomia',
    category: 'environmental',
    subcategory: 'Biodiversidade',
    description: 'Proteção e restauração de ecossistemas e bioeconomia',
    detailed_description: 'Gestão de impactos na biodiversidade, proteção de áreas sensíveis, restauração ecológica e desenvolvimento de produtos e serviços baseados na biodiversidade brasileira.',
    brazilian_relevance: 'Brasil possui 20% da biodiversidade mundial. Lei da Mata Atlântica, Código Florestal e Marco da Bioeconomia são regulações críticas.',
    metrics: [
      {
        code: 'BIO-001',
        name: 'Hectares de Áreas Protegidas',
        unit: 'hectares',
        description: 'Área total sob proteção ou restauração',
        gri_reference: 'GRI 304-3'
      },
      {
        code: 'BIO-002',
        name: 'Investimento em Bioeconomia',
        unit: 'R$',
        description: 'Recursos aplicados em projetos de bioeconomia',
        gri_reference: 'GRI 304'
      },
      {
        code: 'BIO-003',
        name: 'Espécies Ameaçadas Impactadas',
        unit: 'número',
        description: 'Quantidade de espécies da Lista Vermelha em áreas de operação',
        gri_reference: 'GRI 304-4'
      },
      {
        code: 'BIO-004',
        name: 'Receita de Bioprodutos',
        unit: 'R$',
        description: 'Receita proveniente de produtos da biodiversidade',
        gri_reference: 'N/A'
      }
    ],
    gri_standards: ['GRI 304: Biodiversidade'],
    related_sdgs: [15, 14, 12],
    stakeholders_impacted: ['Comunidades locais', 'ONGs ambientais', 'Governo', 'Povos indígenas'],
    example_actions: [
      'Programa de compensação ambiental',
      'Parcerias com ICMBio/IBAMA',
      'Certificação FSC/Rainforest Alliance',
      'Desenvolvimento de bioprodutos amazônicos'
    ],
    icon: '🌿',
    color: '#059669'
  },
  {
    id: 'env-03',
    code: 'ENV-003',
    name: 'Gestão de Resíduos e Economia Circular',
    category: 'environmental',
    subcategory: 'Resíduos',
    description: 'Redução, reutilização e reciclagem de resíduos',
    detailed_description: 'Implementação de práticas de economia circular, logística reversa, redução de resíduos enviados a aterros e transformação de resíduos em recursos.',
    brazilian_relevance: 'Política Nacional de Resíduos Sólidos (PNRS) exige logística reversa. Brasil gera 79 milhões ton/ano de resíduos sólidos urbanos.',
    metrics: [
      {
        code: 'RES-001',
        name: 'Taxa de Reciclagem',
        unit: '%',
        description: 'Percentual de resíduos reciclados ou reutilizados',
        gri_reference: 'GRI 306-3'
      },
      {
        code: 'RES-002',
        name: 'Peso de Embalagens Recicladas',
        unit: 'toneladas',
        description: 'Total de embalagens recicladas ou reutilizadas',
        gri_reference: 'GRI 301-2'
      },
      {
        code: 'RES-003',
        name: 'Resíduos Perigosos',
        unit: 'toneladas',
        description: 'Quantidade de resíduos perigosos gerados',
        gri_reference: 'GRI 306-2'
      },
      {
        code: 'RES-004',
        name: 'Desvio de Aterro',
        unit: '%',
        description: 'Percentual de resíduos desviados de aterros',
        gri_reference: 'GRI 306-5'
      }
    ],
    gri_standards: ['GRI 306: Resíduos', 'GRI 301: Materiais'],
    related_sdgs: [12, 11, 9],
    stakeholders_impacted: ['Clientes', 'Cooperativas de catadores', 'Governo', 'Comunidades'],
    example_actions: [
      'Sistema de logística reversa de embalagens',
      'Acordo setorial com Ministério do Meio Ambiente',
      'Parcerias com cooperativas de reciclagem',
      'Design for circularity em produtos'
    ],
    icon: '♻️',
    color: '#22c55e'
  },
  {
    id: 'env-04',
    code: 'ENV-004',
    name: 'Transição Energética',
    category: 'environmental',
    subcategory: 'Energia',
    description: 'Transição para matriz energética renovável',
    detailed_description: 'Aumento da participação de fontes renováveis na matriz energética, eficiência energética, geração distribuída e armazenamento de energia.',
    brazilian_relevance: 'Brasil já possui 85% de energia renovável na matriz elétrica, mas o desafio é na matriz energética total. Lei 14.300/2022 regulamenta a microgeração.',
    metrics: [
      {
        code: 'ENE-001',
        name: 'Percentual de Energia Renovável',
        unit: '%',
        description: 'Participação de renováveis no consumo total de energia',
        gri_reference: 'GRI 302-1'
      },
      {
        code: 'ENE-002',
        name: 'Investimento em Energia Limpa',
        unit: 'R$',
        description: 'Capital investido em projetos de energia renovável',
        gri_reference: 'N/A'
      },
      {
        code: 'ENE-003',
        name: 'Capacidade Instalada Renovável',
        unit: 'MW',
        description: 'Capacidade de geração própria renovável',
        gri_reference: 'GRI 302-1'
      },
      {
        code: 'ENE-004',
        name: 'Redução de Consumo Energético',
        unit: '%',
        description: 'Redução de consumo por medidas de eficiência',
        gri_reference: 'GRI 302-4'
      }
    ],
    gri_standards: ['GRI 302: Energia'],
    related_sdgs: [7, 13, 9],
    stakeholders_impacted: ['Investidores', 'Fornecedores de energia', 'Comunidades', 'Governo'],
    example_actions: [
      'Instalação de painéis solares (GD)',
      'Contratação de energia renovável (mercado livre)',
      'Certificados I-REC',
      'Programa de eficiência energética'
    ],
    icon: '⚡',
    color: '#eab308'
  },

  // =====================
  // TEMAS SOCIAIS (S)
  // =====================
  {
    id: 'soc-01',
    code: 'SOC-001',
    name: 'Diversidade, Equidade e Inclusão (DEI)',
    category: 'social',
    subcategory: 'Diversidade',
    description: 'Promoção de diversidade e equidade no ambiente de trabalho',
    detailed_description: 'Políticas e práticas para garantir representatividade de grupos minorizados (mulheres, negros, LGBTQIA+, PcD), equidade salarial e ambiente inclusivo.',
    brazilian_relevance: 'Lei de Cotas (8.213/91) para PcD. Crescente pressão de investidores e sociedade por equidade de gênero e racial. Brasil é 51% feminino e 56% negro.',
    metrics: [
      {
        code: 'DEI-001',
        name: 'Representatividade de Mulheres',
        unit: '%',
        description: 'Percentual de mulheres no quadro total',
        gri_reference: 'GRI 405-1'
      },
      {
        code: 'DEI-002',
        name: 'Mulheres em Liderança',
        unit: '%',
        description: 'Percentual de mulheres em cargos de liderança',
        gri_reference: 'GRI 405-1'
      },
      {
        code: 'DEI-003',
        name: 'Representatividade Negra',
        unit: '%',
        description: 'Percentual de pessoas negras no quadro',
        gri_reference: 'GRI 405-1'
      },
      {
        code: 'DEI-004',
        name: 'Equidade Salarial (Gender Pay Gap)',
        unit: '%',
        description: 'Diferença salarial entre gêneros para mesma função',
        gri_reference: 'GRI 405-2'
      },
      {
        code: 'DEI-005',
        name: 'Pessoas com Deficiência',
        unit: '%',
        description: 'Percentual de PcD no quadro de funcionários',
        gri_reference: 'GRI 405-1'
      }
    ],
    gri_standards: ['GRI 405: Diversidade e Igualdade de Oportunidades', 'GRI 406: Não Discriminação'],
    related_sdgs: [5, 10, 8],
    stakeholders_impacted: ['Colaboradores', 'Investidores', 'Sociedade civil', 'Clientes'],
    example_actions: [
      'Programa de recrutamento afirmativo',
      'Política de equidade salarial',
      'Comitê de diversidade e inclusão',
      'Certificação GPTW, EDGE, Selo Pró-Equidade de Gênero e Raça'
    ],
    icon: '🤝',
    color: '#3b82f6'
  },
  {
    id: 'soc-02',
    code: 'SOC-002',
    name: 'Direitos Humanos e Relações Trabalhistas',
    category: 'social',
    subcategory: 'Direitos Humanos',
    description: 'Respeito aos direitos humanos e relações trabalhistas',
    detailed_description: 'Prevenção de trabalho análogo à escravidão, trabalho infantil, liberdade de associação, due diligence de direitos humanos na cadeia de valor.',
    brazilian_relevance: 'Brasil é signatário dos Princípios Orientadores da ONU sobre Empresas e Direitos Humanos. "Lista Suja" do trabalho escravo é referência nacional.',
    metrics: [
      {
        code: 'DH-001',
        name: 'Violações de Direitos Humanos',
        unit: 'número',
        description: 'Casos confirmados de violações',
        gri_reference: 'GRI 406-1'
      },
      {
        code: 'DH-002',
        name: 'Fornecedores Auditados em DH',
        unit: '%',
        description: 'Percentual de fornecedores auditados em direitos humanos',
        gri_reference: 'GRI 414-1'
      },
      {
        code: 'DH-003',
        name: 'Trabalhadores Sindicalizados',
        unit: '%',
        description: 'Percentual de trabalhadores cobertos por acordos coletivos',
        gri_reference: 'GRI 407-1'
      },
      {
        code: 'DH-004',
        name: 'Denúncias de Trabalho Forçado',
        unit: 'número',
        description: 'Casos identificados de trabalho análogo à escravidão',
        gri_reference: 'GRI 409-1'
      }
    ],
    gri_standards: ['GRI 406: Não Discriminação', 'GRI 407: Liberdade de Associação', 'GRI 408: Trabalho Infantil', 'GRI 409: Trabalho Forçado', 'GRI 414: Avaliação Social de Fornecedores'],
    related_sdgs: [8, 16, 10],
    stakeholders_impacted: ['Trabalhadores', 'Sindicatos', 'ONGs', 'Fornecedores', 'Investidores'],
    example_actions: [
      'Due diligence de direitos humanos (UNGPs)',
      'Código de Conduta de Fornecedores',
      'Auditorias sociais na cadeia (SMETA, SA8000)',
      'Canal de denúncias independente'
    ],
    icon: '⚖️',
    color: '#6366f1'
  },
  {
    id: 'soc-03',
    code: 'SOC-003',
    name: 'Saúde e Segurança Ocupacional',
    category: 'social',
    subcategory: 'Saúde e Segurança',
    description: 'Proteção da saúde e segurança dos trabalhadores',
    detailed_description: 'Sistema de gestão de SST, prevenção de acidentes, saúde mental, ergonomia e bem-estar dos colaboradores.',
    brazilian_relevance: 'NRs (Normas Regulamentadoras) do MTE são mandatórias. eSocial exige reporte de acidentes. Crescente atenção à saúde mental pós-pandemia.',
    metrics: [
      {
        code: 'SSO-001',
        name: 'TRIR (Total Recordable Incident Rate)',
        unit: 'taxa',
        description: 'Taxa de incidentes registráveis por 200.000 horas trabalhadas',
        gri_reference: 'GRI 403-9'
      },
      {
        code: 'SSO-002',
        name: 'Taxa de Fatalidade',
        unit: 'número',
        description: 'Número de fatalidades relacionadas ao trabalho',
        gri_reference: 'GRI 403-9'
      },
      {
        code: 'SSO-003',
        name: 'Dias Perdidos',
        unit: 'dias',
        description: 'Total de dias perdidos por afastamentos',
        gri_reference: 'GRI 403-9'
      },
      {
        code: 'SSO-004',
        name: 'Cobertura de Saúde Mental',
        unit: '%',
        description: 'Percentual de colaboradores com acesso a programas de saúde mental',
        gri_reference: 'GRI 403-6'
      },
      {
        code: 'SSO-005',
        name: 'Certificação ISO 45001',
        unit: 'sim/não',
        description: 'Possui certificação ISO 45001 de gestão de SST',
        gri_reference: 'GRI 403-1'
      }
    ],
    gri_standards: ['GRI 403: Saúde e Segurança Ocupacional'],
    related_sdgs: [3, 8],
    stakeholders_impacted: ['Colaboradores', 'Sindicatos', 'Familiares', 'Governo (MTE)'],
    example_actions: [
      'Certificação ISO 45001',
      'CIPA (Comissão Interna de Prevenção de Acidentes)',
      'Programa de saúde mental e bem-estar',
      'Treinamentos obrigatórios de NRs'
    ],
    icon: '🏥',
    color: '#ef4444'
  },
  {
    id: 'soc-04',
    code: 'SOC-004',
    name: 'Engajamento Comunitário e Investimento Social',
    category: 'social',
    subcategory: 'Comunidades',
    description: 'Relacionamento e investimento em comunidades locais',
    detailed_description: 'Programas de desenvolvimento local, consultas comunitárias, investimento social privado e gestão de impactos sociais.',
    brazilian_relevance: 'Territórios tradicionais e indígenas representam 25% do território brasileiro. Consultas prévias são mandatórias (Convenção 169 OIT).',
    metrics: [
      {
        code: 'COM-001',
        name: 'Investimento Social Privado',
        unit: 'R$',
        description: 'Total investido em projetos sociais',
        gri_reference: 'GRI 413-1'
      },
      {
        code: 'COM-002',
        name: 'Pessoas Beneficiadas',
        unit: 'número',
        description: 'Total de pessoas beneficiadas por programas sociais',
        gri_reference: 'GRI 413-1'
      },
      {
        code: 'COM-003',
        name: 'Contratação Local',
        unit: '%',
        description: 'Percentual de líderes contratados da comunidade local',
        gri_reference: 'GRI 202-2'
      },
      {
        code: 'COM-004',
        name: 'Consultas Comunitárias',
        unit: 'número',
        description: 'Quantidade de consultas prévias realizadas',
        gri_reference: 'GRI 413-1'
      }
    ],
    gri_standards: ['GRI 413: Comunidades Locais', 'GRI 202: Presença no Mercado'],
    related_sdgs: [1, 2, 4, 11],
    stakeholders_impacted: ['Comunidades locais', 'ONGs', 'Povos indígenas', 'Governo local'],
    example_actions: [
      'Instituto/Fundação corporativa',
      'Programa de compras locais',
      'Consulta prévia, livre e informada (CPLI)',
      'Parceria com organizações locais'
    ],
    icon: '🏘️',
    color: '#8b5cf6'
  },

  // =====================
  // TEMAS DE GOVERNANÇA (G)
  // =====================
  {
    id: 'gov-01',
    code: 'GOV-001',
    name: 'Ética e Anticorrupção',
    category: 'governance',
    subcategory: 'Ética',
    description: 'Combate à corrupção, suborno e práticas antiéticas',
    detailed_description: 'Código de Ética, Código de Conduta, canal de denúncias, treinamentos, due diligence de terceiros e conformidade com Lei Anticorrupção (12.846/2013).',
    brazilian_relevance: 'Lei Anticorrupção Brasileira (12.846/2013) e CGU exigem programa de compliance. Operação Lava Jato reforçou importância do tema.',
    metrics: [
      {
        code: 'ETI-001',
        name: 'Código de Ética Implementado',
        unit: 'sim/não',
        description: 'Possui Código de Ética formalizado e divulgado',
        gri_reference: 'GRI 102-16'
      },
      {
        code: 'ETI-002',
        name: 'Treinamentos em Anticorrupção',
        unit: '%',
        description: 'Percentual de colaboradores treinados em anticorrupção',
        gri_reference: 'GRI 205-2'
      },
      {
        code: 'ETI-003',
        name: 'Casos Confirmados de Corrupção',
        unit: 'número',
        description: 'Casos confirmados de corrupção no período',
        gri_reference: 'GRI 205-3'
      },
      {
        code: 'ETI-004',
        name: 'Canal de Denúncias',
        unit: 'sim/não',
        description: 'Possui canal de denúncias independente',
        gri_reference: 'GRI 102-17'
      },
      {
        code: 'ETI-005',
        name: 'Fornecedores Avaliados em Anticorrupção',
        unit: '%',
        description: 'Percentual de fornecedores avaliados para riscos de corrupção',
        gri_reference: 'GRI 205-1'
      }
    ],
    gri_standards: ['GRI 205: Anticorrupção', 'GRI 206: Concorrência Desleal'],
    related_sdgs: [16],
    stakeholders_impacted: ['Investidores', 'Governo', 'Parceiros comerciais', 'Sociedade'],
    example_actions: [
      'Certificação ISO 37001 (Anti-suborno)',
      'Programa de Compliance robusto',
      'Due diligence de terceiros (KYC)',
      'Canal de denúncias 24/7 externo'
    ],
    icon: '🛡️',
    color: '#64748b'
  },
  {
    id: 'gov-02',
    code: 'GOV-002',
    name: 'Governança Corporativa',
    category: 'governance',
    subcategory: 'Governança',
    description: 'Estrutura de governança e tomada de decisões',
    detailed_description: 'Composição do Conselho de Administração, independência, diversidade, comitês de assessoramento, remuneração vinculada a ESG.',
    brazilian_relevance: 'Níveis de Governança da B3 (Novo Mercado, N1, N2). Lei das S.A. e Código das Melhores Práticas de Governança do IBGC.',
    metrics: [
      {
        code: 'GC-001',
        name: 'Independência do Conselho',
        unit: '%',
        description: 'Percentual de conselheiros independentes',
        gri_reference: 'GRI 102-22'
      },
      {
        code: 'GC-002',
        name: 'Diversidade de Gênero no Conselho',
        unit: '%',
        description: 'Percentual de mulheres no Conselho de Administração',
        gri_reference: 'GRI 405-1'
      },
      {
        code: 'GC-003',
        name: 'Remuneração Vinculada a ESG',
        unit: '%',
        description: 'Percentual da remuneração variável atrelada a metas ESG',
        gri_reference: 'GRI 102-35'
      },
      {
        code: 'GC-004',
        name: 'Comitê de Sustentabilidade',
        unit: 'sim/não',
        description: 'Possui Comitê de Sustentabilidade/ESG no Conselho',
        gri_reference: 'GRI 102-18'
      },
      {
        code: 'GC-005',
        name: 'Nível de Governança B3',
        unit: 'texto',
        description: 'Novo Mercado, N1, N2 ou Tradicional',
        gri_reference: 'N/A'
      }
    ],
    gri_standards: ['GRI 102: Perfil Organizacional - Governança'],
    related_sdgs: [16],
    stakeholders_impacted: ['Acionistas', 'Investidores', 'Conselheiros', 'Alta liderança'],
    example_actions: [
      'Adesão ao Novo Mercado da B3',
      'Formação de Comitê de Sustentabilidade',
      'Política de diversidade no Conselho',
      'Remuneração variável com KPIs ESG'
    ],
    icon: '👔',
    color: '#475569'
  },
  {
    id: 'gov-03',
    code: 'GOV-003',
    name: 'Transparência e Gestão de Dados',
    category: 'governance',
    subcategory: 'Transparência',
    description: 'Divulgação de informações e proteção de dados',
    detailed_description: 'Relatórios de sustentabilidade (GRI, SASB, TCFD), conformidade com LGPD, cybersecurity e gestão de dados ESG.',
    brazilian_relevance: 'LGPD (Lei 13.709/2018) exige conformidade em proteção de dados. Crescente demanda por relatórios integrados.',
    metrics: [
      {
        code: 'TR-001',
        name: 'Frameworks de Reporte Adotados',
        unit: 'número',
        description: 'Quantidade de frameworks seguidos (GRI, SASB, TCFD, etc.)',
        gri_reference: 'GRI 102-54'
      },
      {
        code: 'TR-002',
        name: 'Asseguração Externa de Relatório',
        unit: 'sim/não',
        description: 'Relatório de sustentabilidade com verificação externa',
        gri_reference: 'GRI 102-56'
      },
      {
        code: 'TR-003',
        name: 'Conformidade com LGPD',
        unit: 'sim/não',
        description: 'Possui programa de adequação à LGPD',
        gri_reference: 'GRI 418-1'
      },
      {
        code: 'TR-004',
        name: 'Incidentes de Vazamento de Dados',
        unit: 'número',
        description: 'Casos confirmados de vazamento de dados',
        gri_reference: 'GRI 418-1'
      },
      {
        code: 'TR-005',
        name: 'Taxa de Resposta a Stakeholders',
        unit: '%',
        description: 'Percentual de consultas de stakeholders respondidas',
        gri_reference: 'GRI 102-43'
      }
    ],
    gri_standards: ['GRI 102: Perfil Organizacional', 'GRI 418: Privacidade do Cliente'],
    related_sdgs: [16, 9],
    stakeholders_impacted: ['Investidores', 'Clientes', 'Reguladores', 'Sociedade civil'],
    example_actions: [
      'Publicação de Relatório Anual Integrado',
      'Verificação externa por Big Four',
      'DPO (Data Protection Officer) nomeado',
      'Plataforma ESG de gestão de dados'
    ],
    icon: '📊',
    color: '#1e293b'
  }
];

// Categorias e cores para visualização
export const MATERIALITY_CATEGORIES = {
  environmental: {
    label: 'Ambiental (E)',
    color: '#10b981',
    icon: '🌱',
    description: 'Impactos ambientais e gestão de recursos naturais'
  },
  social: {
    label: 'Social (S)',
    color: '#3b82f6',
    icon: '👥',
    description: 'Relações com pessoas e comunidades'
  },
  governance: {
    label: 'Governança (G)',
    color: '#64748b',
    icon: '⚖️',
    description: 'Estrutura de governança e ética empresarial'
  }
} as const;

// Helper functions
export function getThemesByCategory(category?: string) {
  if (!category) return MATERIALITY_THEMES_LIBRARY;
  return MATERIALITY_THEMES_LIBRARY.filter(t => t.category === category);
}

export function getThemeById(id: string) {
  return MATERIALITY_THEMES_LIBRARY.find(t => t.id === id);
}

export function getThemesBySDG(sdgNumber: number) {
  return MATERIALITY_THEMES_LIBRARY.filter(t => t.related_sdgs.includes(sdgNumber));
}

export function getTotalMetrics() {
  return MATERIALITY_THEMES_LIBRARY.reduce((sum, theme) => sum + theme.metrics.length, 0);
}

export function getThemesByStakeholder(stakeholder: string) {
  return MATERIALITY_THEMES_LIBRARY.filter(t => 
    t.stakeholders_impacted.some(s => s.toLowerCase().includes(stakeholder.toLowerCase()))
  );
}
