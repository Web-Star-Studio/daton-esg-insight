/**
 * Mock data for Governance modules (risks, compliance, audits, stakeholders)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_STAKEHOLDERS = [
  {
    id: 'stk-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Comunidade Local Vila Norte',
    category: 'community',
    subcategory: 'lideranças comunitárias',
    contact_email: 'comunidade.vilanorte@contato.org',
    contact_phone: '(11) 98888-1001',
    organization: 'Associação Vila Norte',
    position: 'Presidência',
    influence_level: 'high',
    interest_level: 'high',
    engagement_frequency: 'monthly',
    preferred_communication: 'meeting',
    notes: 'Agenda trimestral fixa com pauta de impactos ambientais.',
    is_active: true,
    created_at: '2025-02-10T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'stk-2',
    company_id: DEMO_COMPANY_ID,
    name: 'IBAMA - Coordenação Regional',
    category: 'regulators',
    subcategory: 'órgão ambiental federal',
    contact_email: 'ibama.regional@gov.br',
    contact_phone: '(61) 99999-2002',
    organization: 'IBAMA',
    position: 'Coordenação',
    influence_level: 'high',
    interest_level: 'high',
    engagement_frequency: 'quarterly',
    preferred_communication: 'meeting',
    notes: 'Envio recorrente de relatórios de conformidade.',
    is_active: true,
    created_at: '2025-02-11T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'stk-3',
    company_id: DEMO_COMPANY_ID,
    name: 'Fundo Impacto Verde',
    category: 'investors',
    subcategory: 'investidor institucional',
    contact_email: 'esg@impactoverde.com',
    contact_phone: '(11) 97777-3003',
    organization: 'Impacto Verde Asset',
    position: 'Gestão ESG',
    influence_level: 'high',
    interest_level: 'medium',
    engagement_frequency: 'quarterly',
    preferred_communication: 'email',
    notes: 'Prioriza indicadores de materialidade e emissões.',
    is_active: true,
    created_at: '2025-02-12T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'stk-4',
    company_id: DEMO_COMPANY_ID,
    name: 'Sindicato dos Trabalhadores',
    category: 'employees',
    subcategory: 'representação trabalhista',
    contact_email: 'contato@sindicato.org',
    contact_phone: '(11) 96666-4004',
    organization: 'Sindicato Regional',
    position: 'Diretoria',
    influence_level: 'medium',
    interest_level: 'high',
    engagement_frequency: 'monthly',
    preferred_communication: 'meeting',
    notes: 'Acompanhamento de SST e capacitação.',
    is_active: true,
    created_at: '2025-02-13T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'stk-5',
    company_id: DEMO_COMPANY_ID,
    name: 'Rede de Fornecedores Estratégicos',
    category: 'suppliers',
    subcategory: 'fornecedores críticos',
    contact_email: 'fornecedores@ecotech.com.br',
    contact_phone: '(11) 95555-5005',
    organization: 'Comitê de Fornecedores',
    position: 'Coordenação',
    influence_level: 'medium',
    interest_level: 'medium',
    engagement_frequency: 'quarterly',
    preferred_communication: 'survey',
    notes: 'Painel de performance ESG compartilhado mensalmente.',
    is_active: true,
    created_at: '2025-02-14T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'stk-6',
    company_id: DEMO_COMPANY_ID,
    name: 'Instituto Cidadania Ativa',
    category: 'ngos',
    subcategory: 'parceiro social',
    contact_email: 'projetos@ica.org.br',
    contact_phone: '(11) 94444-6006',
    organization: 'Instituto Cidadania Ativa',
    position: 'Coordenação de Projetos',
    influence_level: 'low',
    interest_level: 'high',
    engagement_frequency: 'biannual',
    preferred_communication: 'meeting',
    notes: 'Parceria em projetos sociais e indicadores de impacto.',
    is_active: true,
    created_at: '2025-02-15T09:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
  },
];

const DEMO_STAKEHOLDER_STATS = {
  total: DEMO_STAKEHOLDERS.length,
  byCategory: DEMO_STAKEHOLDERS.reduce((acc, stakeholder) => {
    acc[stakeholder.category] = (acc[stakeholder.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  byInfluence: DEMO_STAKEHOLDERS.reduce((acc, stakeholder) => {
    acc[stakeholder.influence_level] = (acc[stakeholder.influence_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  byEngagementFrequency: DEMO_STAKEHOLDERS.reduce((acc, stakeholder) => {
    acc[stakeholder.engagement_frequency] = (acc[stakeholder.engagement_frequency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  highInfluenceHighInterest: DEMO_STAKEHOLDERS.filter(
    (stakeholder) => stakeholder.influence_level === 'high' && stakeholder.interest_level === 'high',
  ).length,
};

const DEMO_STAKEHOLDER_ANALYTICS = {
  summary: {
    totalStakeholders: DEMO_STAKEHOLDERS.length,
    activeEngagement: 5,
    averageScore: 74,
    totalInteractions: 63,
    scheduledMeetings: 9,
    overdueFollowups: 2,
    trending: {
      stakeholders: 8,
      engagement: -3,
      interactions: 12,
    },
  },
  engagementByCategory: [
    { category: 'Comunidade', count: 1, avgScore: 82, interactions: 14 },
    { category: 'Reguladores', count: 1, avgScore: 78, interactions: 12 },
    { category: 'Investidores', count: 1, avgScore: 73, interactions: 11 },
    { category: 'Colaboradores', count: 1, avgScore: 76, interactions: 10 },
    { category: 'Fornecedores', count: 1, avgScore: 69, interactions: 9 },
    { category: 'ONGs', count: 1, avgScore: 66, interactions: 7 },
  ],
  engagementTrend: [
    { month: 'Set', score: 68, interactions: 8 },
    { month: 'Out', score: 70, interactions: 9 },
    { month: 'Nov', score: 71, interactions: 10 },
    { month: 'Dez', score: 72, interactions: 11 },
    { month: 'Jan', score: 73, interactions: 12 },
    { month: 'Fev', score: 74, interactions: 13 },
  ],
  influenceDistribution: [
    { name: 'Alta', value: 3, color: '#EF4444' },
    { name: 'Média', value: 2, color: '#F59E0B' },
    { name: 'Baixa', value: 1, color: '#10B981' },
  ],
  interestDistribution: [
    { name: 'Alto', value: 4, color: '#3B82F6' },
    { name: 'Médio', value: 2, color: '#8B5CF6' },
    { name: 'Baixo', value: 0, color: '#6B7280' },
  ],
  maturityRadar: [
    { subject: 'Identificação', score: 78 },
    { subject: 'Engajamento', score: 74 },
    { subject: 'Comunicação', score: 72 },
    { subject: 'Monitoramento', score: 69 },
    { subject: 'Resposta', score: 76 },
  ],
  riskMetrics: [
    { risk: 'Baixo engajamento', stakeholders: 2, trend: 'down' },
    { risk: 'Follow-up atrasado', stakeholders: 2, trend: 'stable' },
    { risk: 'Conflito de interesse', stakeholders: 1, trend: 'down' },
  ],
  upcomingActions: [
    { stakeholder: 'IBAMA - Coordenação Regional', action: 'Envio de relatório semestral', date: '2026-03-10', priority: 'Alta' },
    { stakeholder: 'Comunidade Local Vila Norte', action: 'Reunião de prestação de contas', date: '2026-03-18', priority: 'Média' },
  ],
};

export const governanceMockEntries = [
  // Governance metrics
  {
    queryKey: ['governance-metrics'],
    data: {
      board_independence: 60,
      board_diversity: 40,
      executive_compensation_link: true,
      anti_corruption_training: 95,
      whistleblower_cases_resolved: 100,
    }
  },

  // Employees
  {
    queryKey: ['employees'],
    data: [
      { id: 'emp-1', name: 'Ana Silva', role: 'Diretora ESG', department: 'Sustentabilidade' },
      { id: 'emp-2', name: 'Carlos Santos', role: 'Gerente Ambiental', department: 'Sustentabilidade' },
      { id: 'emp-3', name: 'Maria Santos', role: 'Gerente de Compliance', department: 'Governança' },
    ]
  },
  // Employee stats
  {
    queryKey: ['employee-stats'],
    data: {
      total: 350,
      women_percentage: 45,
      leadership_women_percentage: 35,
      turnover_rate: 5.2,
      training_hours_per_employee: 24,
    }
  },
  // Risk metrics
  {
    queryKey: ['risk-metrics'],
    data: {
      total_risks: 24,
      critical_risks: 3,
      mitigated_risks: 15,
      risks_trend: -2,
    }
  },
  // Board members — fields match BoardMember interface used by GovernanceStructure.tsx
  {
    queryKey: ['board-members'],
    data: [
      {
        id: 'bm-1', company_id: DEMO_COMPANY_ID,
        full_name: 'João Batista Ferreira',
        position: 'Presidente do Conselho',
        committee: 'Comitê de Auditoria',
        is_independent: true,
        gender: 'Masculino',
        age: 58,
        experience_years: 25,
        expertise_areas: ['Finanças', 'Governança', 'Estratégia'],
        appointment_date: '2020-03-15T00:00:00Z',
        term_end_date: '2027-03-15T00:00:00Z',
        status: 'Ativo',
        created_at: '2020-03-15T09:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
      },
      {
        id: 'bm-2', company_id: DEMO_COMPANY_ID,
        full_name: 'Carla Dias Monteiro',
        position: 'Conselheira Independente',
        committee: 'Comitê de ESG',
        is_independent: true,
        gender: 'Feminino',
        age: 47,
        experience_years: 18,
        expertise_areas: ['Sustentabilidade', 'Direito Ambiental', 'ESG'],
        appointment_date: '2021-04-01T00:00:00Z',
        term_end_date: '2027-04-01T00:00:00Z',
        status: 'Ativo',
        created_at: '2021-04-01T09:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
      },
      {
        id: 'bm-3', company_id: DEMO_COMPANY_ID,
        full_name: 'Roberto Almeida Silva',
        position: 'Conselheiro',
        committee: 'Comitê de Remuneração',
        is_independent: false,
        gender: 'Masculino',
        age: 52,
        experience_years: 22,
        expertise_areas: ['Operações', 'Supply Chain', 'Indústria'],
        appointment_date: '2018-01-10T00:00:00Z',
        term_end_date: '2026-12-31T00:00:00Z',
        status: 'Ativo',
        created_at: '2018-01-10T09:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
      },
    ],
  },
  // Whistleblower reports — fields match WhistleblowerReport interface used by EthicsChannel.tsx
  {
    queryKey: ['whistleblower-reports'],
    data: [
      {
        id: 'wr-1', company_id: DEMO_COMPANY_ID,
        report_code: 'RPT-2026-001',
        category: 'Assédio Moral',
        description: 'Relato de comportamento inadequado por parte de liderança intermediária.',
        incident_date: '2026-01-05T00:00:00Z',
        location: 'Fábrica Guarulhos',
        is_anonymous: true,
        status: 'Resolvida',
        priority: 'Alta',
        created_at: '2026-01-10T09:00:00Z',
        updated_at: '2026-02-15T14:00:00Z',
      },
      {
        id: 'wr-2', company_id: DEMO_COMPANY_ID,
        report_code: 'RPT-2026-002',
        category: 'Conflito de Interesses',
        description: 'Suspeita de contratação com vínculo familiar não declarado.',
        incident_date: '2026-02-01T00:00:00Z',
        location: 'Matriz São Paulo',
        is_anonymous: false,
        reporter_name: 'Denúncia Identificada',
        status: 'Em Investigação',
        priority: 'Média',
        created_at: '2026-02-08T11:00:00Z',
        updated_at: '2026-02-20T09:00:00Z',
      },
    ],
  },
  // Risk matrices
  {
    queryKey: ['risk-matrices'],
    data: [
      {
        id: 'rm-1',
        name: 'Matriz de Riscos ESG 2026',
        description: 'Avaliação anual de riscos ESG',
        status: 'Active',
      }
    ]
  },
  // Governance dashboard

  // Governance dashboard (base)
  {
    queryKey: ['governance-dashboard'],
    data: {
      totalRisks: 8,
      criticalRisks: 2,
      complianceRate: 94.5,
      pendingAudits: 1,
      stakeholderEngagement: 72,
    },
  },
  // ESG Risks — fields match ESGRisk interface used by ESGRisksMatrix.tsx
  // A single comprehensive dataset is shared for both the scoped and unscoped query keys.
  {
    queryKey: ['esg-risks', DEMO_COMPANY_ID],
    data: [
      { id: '1', company_id: DEMO_COMPANY_ID, risk_title: 'Vazamento de Efluentes', risk_description: 'Risco de vazamento de efluentes industriais nos sistemas de tratamento.', esg_category: 'Ambiental', probability: 'Média', impact: 'Alto', inherent_risk_level: 'Alto', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Manutenção preventiva dos sistemas de tratamento', next_review_date: '2026-04-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '2', company_id: DEMO_COMPANY_ID, risk_title: 'Descumprimento NR-12', risk_description: 'Não conformidade com norma de segurança em máquinas e equipamentos.', esg_category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', owner_user_id: 'emp-4', treatment_plan: 'Programa de adequação de máquinas', next_review_date: '2026-03-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '3', company_id: DEMO_COMPANY_ID, risk_title: 'Fraude Contábil', risk_description: 'Risco de manipulação de registros financeiros e contábeis.', esg_category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', owner_user_id: 'emp-5', treatment_plan: 'Auditoria interna periódica', next_review_date: '2026-06-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '4', company_id: DEMO_COMPANY_ID, risk_title: 'Multas Ambientais', risk_description: 'Risco de aplicação de multas por descumprimento de condicionantes ambientais.', esg_category: 'Ambiental', probability: 'Alta', impact: 'Alto', inherent_risk_level: 'Crítico', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Monitoramento contínuo de parâmetros', next_review_date: '2026-03-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: '5', company_id: DEMO_COMPANY_ID, risk_title: 'Interrupção de Fornecimento', risk_description: 'Risco de paralisação da cadeia produtiva por falha em fornecedor crítico.', esg_category: 'Governança', probability: 'Média', impact: 'Médio', inherent_risk_level: 'Médio', status: 'Ativo', owner_user_id: 'emp-1', treatment_plan: 'Diversificação de fornecedores', next_review_date: '2026-05-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '6', company_id: DEMO_COMPANY_ID, risk_title: 'Violação LGPD', risk_description: 'Risco de incidente de segurança com dados pessoais de colaboradores ou clientes.', esg_category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', owner_user_id: 'emp-7', treatment_plan: 'Programa de adequação LGPD', next_review_date: '2026-06-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '7', company_id: DEMO_COMPANY_ID, risk_title: 'Acidente de Trabalho Fatal', risk_description: 'Risco de acidente grave envolvendo colaboradores nas operações industriais.', esg_category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Crítico', status: 'Ativo', owner_user_id: 'emp-4', treatment_plan: 'Programa Zero Acidentes', next_review_date: '2026-03-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: '8', company_id: DEMO_COMPANY_ID, risk_title: 'Escassez H\u00eddrica', risk_description: 'Risco de restrição no uso de água por crise hídrica regional.', esg_category: 'Ambiental', probability: 'M\u00e9dia', impact: 'M\u00e9dio', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Sistema de reuso de água', next_review_date: '2026-04-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
    ],
  },
  // ESG Risks (unscoped) — same comprehensive dataset as the scoped entry above
  {
    queryKey: ['esg-risks'],
    data: [
      { id: '1', company_id: DEMO_COMPANY_ID, risk_title: 'Vazamento de Efluentes', risk_description: 'Risco de vazamento de efluentes industriais nos sistemas de tratamento.', esg_category: 'Ambiental', probability: 'M\u00e9dia', impact: 'Alto', inherent_risk_level: 'Alto', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Manutenção preventiva dos sistemas de tratamento', next_review_date: '2026-04-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '2', company_id: DEMO_COMPANY_ID, risk_title: 'Descumprimento NR-12', risk_description: 'Não conformidade com norma de segurança em máquinas e equipamentos.', esg_category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-4', treatment_plan: 'Programa de adequação de máquinas', next_review_date: '2026-03-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '3', company_id: DEMO_COMPANY_ID, risk_title: 'Fraude Cont\u00e1bil', risk_description: 'Risco de manipulação de registros financeiros e contábeis.', esg_category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-5', treatment_plan: 'Auditoria interna periódica', next_review_date: '2026-06-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '4', company_id: DEMO_COMPANY_ID, risk_title: 'Multas Ambientais', risk_description: 'Risco de aplicação de multas por descumprimento de condicionantes ambientais.', esg_category: 'Ambiental', probability: 'Alta', impact: 'Alto', inherent_risk_level: 'Cr\u00edtico', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Monitoramento contínuo de parâmetros', next_review_date: '2026-03-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: '5', company_id: DEMO_COMPANY_ID, risk_title: 'Interrupção de Fornecimento', risk_description: 'Risco de paralisação da cadeia produtiva por falha em fornecedor crítico.', esg_category: 'Governança', probability: 'M\u00e9dia', impact: 'M\u00e9dio', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-1', treatment_plan: 'Diversificação de fornecedores', next_review_date: '2026-05-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '6', company_id: DEMO_COMPANY_ID, risk_title: 'Violação LGPD', risk_description: 'Risco de incidente de segurança com dados pessoais de colaboradores ou clientes.', esg_category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-7', treatment_plan: 'Programa de adequação LGPD', next_review_date: '2026-06-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: '7', company_id: DEMO_COMPANY_ID, risk_title: 'Acidente de Trabalho Fatal', risk_description: 'Risco de acidente grave envolvendo colaboradores nas operações industriais.', esg_category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Cr\u00edtico', status: 'Ativo', owner_user_id: 'emp-4', treatment_plan: 'Programa Zero Acidentes', next_review_date: '2026-03-01T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: '8', company_id: DEMO_COMPANY_ID, risk_title: 'Escassez H\u00eddrica', risk_description: 'Risco de restrição no uso de água por crise hídrica regional.', esg_category: 'Ambiental', probability: 'M\u00e9dia', impact: 'M\u00e9dio', inherent_risk_level: 'M\u00e9dio', status: 'Ativo', owner_user_id: 'emp-2', treatment_plan: 'Sistema de reuso de água', next_review_date: '2026-04-15T00:00:00Z', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
    ],
  },
  // Compliance

  // Compliance (base)
  {
    queryKey: ['compliance'],
    data: [
      { id: '1', name: 'LGPD', status: 'Conforme', compliance_percentage: 92 },
      { id: '2', name: 'ISO 14001:2015', status: 'Conforme', compliance_percentage: 88 },
    ],
  },
  // Compliance tasks

  {
    queryKey: ['compliance-tasks'],
    data: [
      { id: 'ct-1', title: 'Renovar Licença de Operação', requirement: 'Condicionantes Ambientais', category: 'Environmental', due_date: '2026-03-15', status: 'Em progresso', priority: 'high', is_template: false },
      { id: 'ct-2', title: 'Treinamento LGPD Anual', requirement: 'Política de Privacidade', category: 'Data & Privacy', due_date: '2026-02-28', status: 'Atrasado', priority: 'medium', is_template: false },
    ]
  },
  // Licenses

  {
    queryKey: ['licenses'],
    data: [
      { id: 'lic-1', name: 'Licença de Operação (LO)', issuing_body: 'CETESB', expiration_date: '2026-03-15', status: 'Válida' },
      { id: 'lic-3', name: 'Outorga de Uso de Água', issuing_body: 'DAEE', expiration_date: '2024-11-20', status: 'Vencida' },
    ]
  },
  // Compliance audit trail
  {
    queryKey: ['compliance-audit-trail', DEMO_COMPANY_ID],
    data: [
      { id: 'cat-1', action_type: 'UPDATE', entity_type: 'compliance_tasks', entity_id: 'ct-1', previous_state: { status: 'Pendente' }, new_state: { status: 'Em progresso' }, created_by_user_id: 'emp-2', created_at: '2026-02-15T14:30:00Z', company_id: DEMO_COMPANY_ID },
      { id: 'cat-2', action_type: 'CREATE', entity_type: 'compliance_tasks', entity_id: 'ct-3', previous_state: null, new_state: { title: 'Relatório Trimestral CIPA' }, created_by_user_id: 'emp-1', created_at: '2026-02-10T09:15:00Z', company_id: DEMO_COMPANY_ID },
    ]
  },
  {
    queryKey: ['compliance-audit-trail'],
    data: [
      { id: 'cat-1', action_type: 'UPDATE', entity_type: 'compliance_tasks', entity_id: 'ct-1', created_at: '2026-02-15T14:30:00Z' }
    ]
  },
  // Corporate policies
  {
    queryKey: ['corporate-policies', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Política de Sustentabilidade', category: 'ESG', status: 'Ativo', version: '3.0', description: 'Diretrizes para gestão sustentável das operações e cadeia de valor da empresa.', effective_date: '2025-07-01T00:00:00Z', approval_date: '2025-06-15T00:00:00Z', review_date: '2026-06-15T00:00:00Z', next_review: '2026-06-15' },
      { id: '2', title: 'Código de Ética', category: 'Governança', status: 'Ativo', version: '5.1', description: 'Princípios e valores que norteiam a conduta de todos os colaboradores e parceiros.', effective_date: '2025-01-15T00:00:00Z', approval_date: '2025-01-01T00:00:00Z', review_date: '2026-01-01T00:00:00Z', next_review: '2026-01-01' },
      { id: '3', title: 'Política Anticorrupção', category: 'Compliance', status: 'Ativo', version: '2.0', description: 'Diretrizes para prevenção, detecção e combate à corrupção e suborno.', effective_date: '2024-12-15T00:00:00Z', approval_date: '2024-12-01T00:00:00Z', review_date: '2025-12-01T00:00:00Z', next_review: '2025-12-01' },
    ],
  },
  // Corporate policies (base)
  {
    queryKey: ['corporate-policies'],
    data: [
      { id: '1', title: 'Política de Sustentabilidade', category: 'ESG', status: 'Ativo', version: '3.0', description: 'Diretrizes para gestão sustentável das operações.', effective_date: '2025-07-01T00:00:00Z', approval_date: '2025-06-15T00:00:00Z', review_date: '2026-06-15T00:00:00Z' },
      { id: '2', title: 'Código de Ética', category: 'Governança', status: 'Ativo', version: '5.1', description: 'Princípios e valores que norteiam a conduta de todos.', effective_date: '2025-01-15T00:00:00Z', approval_date: '2025-01-01T00:00:00Z', review_date: '2026-01-01T00:00:00Z' },
    ],
  },
  // Audits
  {
    queryKey: ['audits', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Auditoria Interna ISO 14001', audit_type: 'Interna', status: 'Concluída', start_date: '2025-11-15', end_date: '2025-11-20', lead_auditor: 'Paulo Alves', findings_count: 5, nc_count: 2, company_id: DEMO_COMPANY_ID },
      { id: '2', title: 'Auditoria de Compliance LGPD', audit_type: 'Interna', status: 'Concluída', start_date: '2026-01-10', end_date: '2026-01-12', lead_auditor: 'Fernanda Rocha', findings_count: 3, nc_count: 0, company_id: DEMO_COMPANY_ID },
      { id: '3', title: 'Auditoria Externa ISO 9001', audit_type: 'Externa', status: 'Planejada', start_date: '2026-04-01', end_date: '2026-04-05', lead_auditor: 'Bureau Veritas', findings_count: 0, nc_count: 0, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Audits (base)
  {
    queryKey: ['audits'],
    data: [
      { id: '1', title: 'Auditoria Interna ISO 14001', audit_type: 'Interna', status: 'Concluída' },
      { id: '2', title: 'Auditoria de Compliance LGPD', audit_type: 'Interna', status: 'Concluída' },
    ],
  },
  // Stakeholders
  {
    queryKey: ['stakeholders', DEMO_COMPANY_ID],
    data: DEMO_STAKEHOLDERS,
  },
  // Stakeholders (base)
  {
    queryKey: ['stakeholders'],
    data: DEMO_STAKEHOLDERS,
  },
  // Stakeholder engagement statistics
  {
    queryKey: ['stakeholder-stats'],
    data: DEMO_STAKEHOLDER_STATS,
  },
  // Stakeholder analytics and matrix views
  {
    queryKey: ['stakeholder-analytics'],
    data: DEMO_STAKEHOLDER_ANALYTICS,
  },
  {
    queryKey: ['stakeholders-matrix'],
    data: DEMO_STAKEHOLDERS,
  },
  // Materiality analysis
  {
    queryKey: ['materiality-analysis', DEMO_COMPANY_ID],
    data: {
      topics: [
        { id: '1', topic: 'Mudanças Climáticas', importance_stakeholder: 9.2, importance_company: 8.8, is_material: true },
        { id: '2', topic: 'Saúde e Segurança', importance_stakeholder: 9.5, importance_company: 9.0, is_material: true },
        { id: '3', topic: 'Ética e Transparência', importance_stakeholder: 9.0, importance_company: 8.5, is_material: true },
        { id: '4', topic: 'Gestão de Resíduos', importance_stakeholder: 8.5, importance_company: 8.2, is_material: true },
        { id: '5', topic: 'Diversidade e Inclusão', importance_stakeholder: 7.8, importance_company: 7.2, is_material: true },
        { id: '6', topic: 'Gestão de Água', importance_stakeholder: 7.5, importance_company: 8.0, is_material: true },
      ],
    },
  },
  // Materiality analysis (base)
  {
    queryKey: ['materiality-analysis'],
    data: {
      topics: [
        { id: '1', topic: 'Mudanças Climáticas', importance_stakeholder: 9.2, importance_company: 8.8, is_material: true },
        { id: '2', topic: 'Saúde e Segurança', importance_stakeholder: 9.5, importance_company: 9.0, is_material: true },
      ],
    },
  },
  // Opportunities
  {
    queryKey: ['opportunities', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Implementação de Painéis Solares', description: 'Redução de custos', category: 'Ambiental', probability: 'Alta', impact: 'Alto', status: 'Em Análise', potential_value: 150000, implementation_cost: 50000 },
      { id: '2', title: 'Programa de Diversidade', description: 'Atração de talentos', category: 'Social', probability: 'Alta', impact: 'Médio', status: 'Em Implementação', potential_value: null },
      { id: '3', title: 'Créditos de Carbono', description: 'Venda de créditos', category: 'Financeiro', probability: 'Média', impact: 'Alto', status: 'Em Análise', potential_value: 500000 }
    ],
  },
  // Opportunities (base)
  {
    queryKey: ['opportunities'],
    data: [
      { id: '1', title: 'Implementação de Painéis Solares', description: 'Redução de custos', category: 'Ambiental', probability: 'Alta', impact: 'Alto', status: 'Em Análise', potential_value: 150000, implementation_cost: 50000 },
      { id: '2', title: 'Programa de Diversidade', description: 'Atração de talentos', category: 'Social', probability: 'Alta', impact: 'Médio', status: 'Em Implementação', potential_value: null },
      { id: '3', title: 'Créditos de Carbono', description: 'Venda de créditos', category: 'Financeiro', probability: 'Média', impact: 'Alto', status: 'Em Análise', potential_value: 500000 }
    ],
  },
  // Opportunity Matrix
  {
    queryKey: ['opportunity-matrix'],
    data: {
      'Alta': { 'Baixo': 0, 'Médio': 1, 'Alto': 1 },
      'Média': { 'Baixo': 0, 'Médio': 0, 'Alto': 1 },
      'Baixa': { 'Baixo': 0, 'Médio': 0, 'Alto': 0 },
    }
  },
  // SWOT Analyses
  {
    queryKey: ['swot-analyses'],
    data: [
      {
        id: "demo-swot-1",
        title: "Análise SWOT 2026",
        description: "Análise estratégica anual de sustentabilidade e negócios.",
        created_at: "2026-01-01T00:00:00.000Z"
      }
    ]
  },
  // SWOT Items
  {
    queryKey: ['swot-items', 'demo-swot-1'],
    data: [
      { id: "item-1", category: "strengths", item_text: "Marca Forte em Sustentabilidade", description: "Reconhecimento no mercado pelas práticas ESG.", impact_level: "high" },
      { id: "item-2", category: "strengths", item_text: "Equipe Capacitada", description: "Baixa rotatividade e alta especialização técnica.", impact_level: "medium" },
      { id: "item-3", category: "weaknesses", item_text: "Dependência de Fornecedores Externos", description: "Cadeia de suprimentos vulnerável a interrupções globais.", impact_level: "high" },
      { id: "item-4", category: "opportunities", item_text: "Expansão para Mercados Verdes", description: "Novos produtos focados na economia circular.", impact_level: "high" },
      { id: "item-5", category: "threats", item_text: "Novas Regulamentações Ambientais", description: "Maior rigor na legislação de emissões.", impact_level: "medium" }
    ]
  },
  // Risk matrix — counts match the 8 active demo esg-risks above
  // Baixa/Alto=4 (ids 2,3,6,7), Média/Alto=1 (id 1), Média/Médio=2 (ids 5,8), Alta/Alto=1 (id 4)
  {
    queryKey: ['risk-matrix'],
    data: {
      'Baixa': { 'Baixo': 0, 'M\u00e9dio': 0, 'Alto': 4 },
      'M\u00e9dia': { 'Baixo': 0, 'M\u00e9dio': 2, 'Alto': 1 },
      'Alta': { 'Baixo': 0, 'M\u00e9dio': 0, 'Alto': 1 }
    },
  },
  // Audit programs
  {
    queryKey: ['audit-programs'],
    data: [
      {
        id: 'ap-demo-1',
        company_id: DEMO_COMPANY_ID,
        year: 2026,
        title: 'Programa de Auditoria 2026',
        status: 'in_progress',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        objectives: 'Avaliar conformidade com ISO 14001, LGPD e requisitos ESG.',
        scope_description: 'Todas as unidades operacionais e processos críticos.',
        resources_budget: 150000,
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2026-01-20T09:00:00Z',
      },
      {
        id: 'ap-demo-2',
        company_id: DEMO_COMPANY_ID,
        year: 2025,
        title: 'Programa de Auditoria 2025',
        status: 'completed',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        objectives: 'Auditoria de conformidade ambiental e governança.',
        scope_description: 'Processos de produção e logística.',
        resources_budget: 120000,
        created_at: '2024-12-10T10:00:00Z',
        updated_at: '2025-12-20T16:00:00Z',
      },
    ],
  },
  // Process maps — status and process_type values match MapeamentoProcessos.tsx filters
  {
    queryKey: ['processMaps'],
    data: [
      {
        id: 'pm-demo-1',
        company_id: DEMO_COMPANY_ID,
        name: 'Gestão de Resíduos',
        description: 'Mapa do processo de coleta, segregação e destinação de resíduos sólidos.',
        process_type: 'Apoio',
        status: 'Approved',
        version: '2.1',
        is_current_version: true,
        canvas_data: {},
        created_at: '2025-06-10T09:00:00Z',
        updated_at: '2026-01-08T14:00:00Z',
      },
      {
        id: 'pm-demo-2',
        company_id: DEMO_COMPANY_ID,
        name: 'Controle de Emissões',
        description: 'Mapeamento do processo de monitoramento e reporte de emissões de GEE.',
        process_type: 'Estratégico',
        status: 'Approved',
        version: '1.3',
        is_current_version: true,
        canvas_data: {},
        created_at: '2025-08-22T11:00:00Z',
        updated_at: '2025-12-15T10:00:00Z',
      },
      {
        id: 'pm-demo-3',
        company_id: DEMO_COMPANY_ID,
        name: 'Gestão de Fornecedores',
        description: 'Processo de qualificação, avaliação e monitoramento de fornecedores.',
        process_type: 'Operacional',
        status: 'Draft',
        version: '1.0',
        is_current_version: true,
        canvas_data: {},
        created_at: '2026-01-15T08:00:00Z',
        updated_at: '2026-02-01T11:00:00Z',
      },
    ],
  },
  // Regulatory requirements (Compliance page)
  {
    queryKey: ['regulatory-requirements'],
    data: [
      { id: 'rr-1', title: 'LGPD - Lei Geral de Proteção de Dados', category: 'Legal', status: 'Compliant', deadline: '2026-12-31', priority: 'high', created_at: '2025-01-15T08:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: 'rr-2', title: 'ISO 14001 - Gestão Ambiental', category: 'Ambiental', status: 'In Progress', deadline: '2026-06-30', priority: 'high', created_at: '2025-02-01T08:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: 'rr-3', title: 'NR-15 - Atividades Insalubres', category: 'Segurança', status: 'Compliant', deadline: '2026-03-31', priority: 'medium', created_at: '2025-03-01T08:00:00Z', updated_at: '2026-01-20T10:00:00Z' },
      { id: 'rr-4', title: 'Resolução CONAMA 307/2002', category: 'Ambiental', status: 'Compliant', deadline: '2026-12-31', priority: 'medium', created_at: '2025-04-01T08:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
    ],
  },
  // Compliance stats (Compliance page)
  {
    queryKey: ['compliance-stats'],
    data: {
      total: 24,
      compliant: 18,
      inProgress: 4,
      overdue: 2,
      complianceRate: 75,
      criticalCount: 2,
      overdueCount: 2,
      upcomingCount: 6,
    },
  },
  // Strategic maps (PlanejamentoEstrategico page)
  {
    queryKey: ['strategic-maps'],
    data: [
      {
        id: 'sm-demo-1',
        company_id: DEMO_COMPANY_ID,
        name: 'Mapa Estratégico ESG 2026',
        description: 'Planejamento estratégico focado em sustentabilidade e governança corporativa.',
        created_at: '2025-11-01T09:00:00Z',
        updated_at: '2026-01-10T14:00:00Z',
      },
    ],
  },
  // BSC perspectives
  {
    queryKey: ['bsc-perspectives', 'sm-demo-1'],
    data: [
      { id: 'bsc-1', strategic_map_id: 'sm-demo-1', name: 'Financeira', description: 'Resultados financeiros e retorno sobre investimento ESG', order_index: 1 },
      { id: 'bsc-2', strategic_map_id: 'sm-demo-1', name: 'Clientes', description: 'Satisfação e valor para clientes e stakeholders', order_index: 2 },
      { id: 'bsc-3', strategic_map_id: 'sm-demo-1', name: 'Processos Internos', description: 'Eficiência operacional e sustentabilidade', order_index: 3 },
      { id: 'bsc-4', strategic_map_id: 'sm-demo-1', name: 'Aprendizado e Crescimento', description: 'Capacitação e inovação', order_index: 4 },
    ],
  },
  {
    queryKey: ['bsc-perspectives'],
    data: [
      { id: 'bsc-1', name: 'Financeira', order_index: 1 },
      { id: 'bsc-2', name: 'Clientes', order_index: 2 },
      { id: 'bsc-3', name: 'Processos Internos', order_index: 3 },
      { id: 'bsc-4', name: 'Aprendizado e Crescimento', order_index: 4 },
    ],
  },
  // Strategic objectives
  {
    queryKey: ['strategic-objectives', 'sm-demo-1'],
    data: [
      { id: 'so-1', strategic_map_id: 'sm-demo-1', perspective_id: 'bsc-1', name: 'Reduzir custos ambientais em 15%', target: 15, current: 8.5, unit: '%' },
      { id: 'so-2', strategic_map_id: 'sm-demo-1', perspective_id: 'bsc-3', name: 'Zero incidentes ambientais', target: 0, current: 1, unit: 'incidentes' },
    ],
  },
  {
    queryKey: ['strategic-objectives'],
    data: [],
  },
  // OKR objectives
  {
    queryKey: ['okr-objectives', 'sm-demo-1'],
    data: [
      { id: 'okr-1', strategic_map_id: 'sm-demo-1', title: 'Neutralidade de Carbono até 2030', quarter: 'Q1/2026', progress: 22, status: 'on_track' },
      { id: 'okr-2', strategic_map_id: 'sm-demo-1', title: 'Certificação ISO 14001', quarter: 'Q2/2026', progress: 65, status: 'on_track' },
    ],
  },
  {
    queryKey: ['okr-objectives'],
    data: [],
  },
  // OKRs — queryKey used by OKRManagement.tsx component
  {
    queryKey: ['okrs'],
    data: [
      { id: 'okr-demo-1', title: 'Neutralidade de Carbono até 2030', description: 'Atingir emissões líquidas zero até 2030 por meio de reduções e compensações.', quarter: 'Q1', year: 2026, status: 'active', progress_percentage: 22, created_at: '2025-12-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: 'okr-demo-2', title: 'Certificação ISO 14001', description: 'Obter certificação do sistema de gestão ambiental até Q2/2026.', quarter: 'Q2', year: 2026, status: 'active', progress_percentage: 65, created_at: '2025-12-01T09:00:00Z', updated_at: '2026-02-15T10:00:00Z' },
      { id: 'okr-demo-3', title: 'Zero Acidente Fatal', description: 'Manter taxa de acidentes fatais em zero por meio do Programa Zero Acidentes.', quarter: 'Q1', year: 2026, status: 'active', progress_percentage: 100, created_at: '2025-12-01T09:00:00Z', updated_at: '2026-02-27T10:00:00Z' },
    ],
  },
  // Key results for OKRs
  {
    queryKey: ['key-results', 'okr-demo-1'],
    data: [
      { id: 'kr-1', okr_id: 'okr-demo-1', title: 'Reduzir emissões Escopo 1 em 20%', target_value: 20, current_value: 4.4, unit: '%', progress_percentage: 22, due_date: '2026-12-31T00:00:00Z', status: 'in_progress' },
      { id: 'kr-2', okr_id: 'okr-demo-1', title: 'Implantar 5 projetos de energia renovável', target_value: 5, current_value: 1, unit: 'projetos', progress_percentage: 20, due_date: '2026-10-31T00:00:00Z', status: 'in_progress' },
    ],
  },
  {
    queryKey: ['key-results', 'okr-demo-2'],
    data: [
      { id: 'kr-3', okr_id: 'okr-demo-2', title: 'Concluir auditoria de pré-certificação', target_value: 1, current_value: 1, unit: 'auditoria', progress_percentage: 100, due_date: '2026-03-31T00:00:00Z', status: 'completed' },
      { id: 'kr-4', okr_id: 'okr-demo-2', title: 'Fechar 100% das não conformidades', target_value: 100, current_value: 65, unit: '%', progress_percentage: 65, due_date: '2026-05-31T00:00:00Z', status: 'in_progress' },
    ],
  },
  {
    queryKey: ['key-results'],
    data: [],
  },
  // Benchmark data — BenchmarkComparisonWidget.tsx (DashboardGHG, queryKey: ['benchmark-data'])
  {
    queryKey: ['benchmark-data'],
    data: {
      sector_comparison: [
        { metric: 'Emissões GEE (tCO2e)', your_company: 845, sector_average: 1100, best_practice: 420 },
        { metric: 'Consumo de Água (m³)', your_company: 12450, sector_average: 18000, best_practice: 8000 },
        { metric: 'Resíduos Reciclados (%)', your_company: 72.5, sector_average: 55, best_practice: 90 },
        { metric: 'Energia Renovável (%)', your_company: 38, sector_average: 25, best_practice: 75 },
      ],
      performance_indicators: [
        { name: 'Eficiência Energética', description: 'Consumo por unidade produzida', score: 74, status: 'above_average' },
        { name: 'Gestão Hídrica', description: 'Índice de reuso e captação', score: 68, status: 'average' },
        { name: 'Gestão de Resíduos', description: 'Taxa de reciclagem e destinação', score: 82, status: 'above_average' },
        { name: 'Emissões Relativas', description: 'tCO2e por receita líquida', score: 61, status: 'average' },
      ],
    },
  },
  // Risk occurrences — RiskOccurrencesList.tsx (GestaoRiscos, queryKey: ['risk-occurrences'])
  {
    queryKey: ['risk-occurrences'],
    data: [
      { id: 'ro-1', title: 'Vazamento de Efluente', description: 'Pequeno vazamento na canaleta de coleta da planta 2', status: 'Em Tratamento', actual_impact: 'Médio', occurrence_date: '2026-02-10T09:30:00Z', financial_impact: 15000, created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-12T14:00:00Z' },
      { id: 'ro-2', title: 'Acidente de Trabalho Leve', description: 'Colaborador com lesão ao manusear equipamento de movimentação', status: 'Resolvida', actual_impact: 'Baixo', occurrence_date: '2026-01-22T14:15:00Z', financial_impact: 3500, created_at: '2026-01-22T15:00:00Z', updated_at: '2026-01-28T11:00:00Z' },
      { id: 'ro-3', title: 'Notificação de Irregularidade Ambiental', description: 'Notificação de irregularidade no descarte de resíduos Classe I', status: 'Aberta', actual_impact: 'Alto', occurrence_date: '2026-02-20T00:00:00Z', financial_impact: 85000, created_at: '2026-02-21T09:00:00Z', updated_at: '2026-02-21T09:00:00Z' },
    ],
  },
  // Occurrence metrics — RiskOccurrencesList.tsx (queryKey: ['occurrence-metrics'])
  {
    queryKey: ['occurrence-metrics'],
    data: {
      total: 3,
      open: 2,
      resolved: 1,
      avgResolutionDays: 6,
      totalFinancialImpact: 103500,
    },
  },
  // Audit areas — AuditAreasManagement.tsx (via useAuditAreas hook, queryKey: ['audit-areas'])
  {
    queryKey: ['audit-areas'],
    data: [
      { id: 'aa-1', company_id: DEMO_COMPANY_ID, name: 'Gestão Ambiental', description: 'Processos de controle e monitoramento ambiental', department: 'Sustentabilidade', risk_level: 'Alto', applicable_standards: ['ISO 14001', 'CONAMA 430'], next_audit_date: '2026-04-15T00:00:00Z', status: 'active', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
      { id: 'aa-2', company_id: DEMO_COMPANY_ID, name: 'Saúde e Segurança', description: 'Cumprimento de normas regulamentadoras de SST', department: 'RH', risk_level: 'Alto', applicable_standards: ['ISO 45001', 'NR-12', 'NR-15'], next_audit_date: '2026-03-20T00:00:00Z', status: 'active', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
      { id: 'aa-3', company_id: DEMO_COMPANY_ID, name: 'Qualidade de Produto', description: 'Conformidade do processo produtivo com ISO 9001', department: 'Produção', risk_level: 'Médio', applicable_standards: ['ISO 9001'], next_audit_date: '2026-06-01T00:00:00Z', status: 'active', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
      { id: 'aa-4', company_id: DEMO_COMPANY_ID, name: 'Privacidade de Dados', description: 'Conformidade com LGPD e políticas de proteção de dados', department: 'TI', risk_level: 'Médio', applicable_standards: ['LGPD', 'ISO 27001'], next_audit_date: '2026-05-10T00:00:00Z', status: 'active', created_at: '2025-06-01T09:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
    ],
  },
  // Audit standards — StandardsLibrary.tsx (via useStandards hook, queryKey: ['audit-standards'])
  {
    queryKey: ['audit-standards'],
    data: [
      { id: 'as-1', company_id: DEMO_COMPANY_ID, code: 'ISO 14001', name: 'Sistema de Gestão Ambiental', version: '2015', description: 'Requisitos para um sistema de gestão ambiental eficaz.', calculation_method: 'weight_based', auto_numbering: true, allow_partial_response: true, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      { id: 'as-2', company_id: DEMO_COMPANY_ID, code: 'ISO 9001', name: 'Sistema de Gestão da Qualidade', version: '2015', description: 'Requisitos para um sistema de gestão da qualidade.', calculation_method: 'weight_based', auto_numbering: true, allow_partial_response: true, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      { id: 'as-3', company_id: DEMO_COMPANY_ID, code: 'ISO 45001', name: 'Sistema de Gestão de SST', version: '2018', description: 'Requisitos para um sistema de gestão de saúde e segurança no trabalho.', calculation_method: 'weight_based', auto_numbering: true, allow_partial_response: false, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    ],
  },
  // Audit templates — TemplatesManager.tsx (via useTemplates hook, queryKey: ['audit-templates'])
  // NOTE: Different from ['smart-templates'] used in relatorios-integrados
  {
    queryKey: ['audit-templates'],
    data: [
      { id: 'at-1', company_id: DEMO_COMPANY_ID, name: 'Auditoria ISO 14001', description: 'Template para auditoria do sistema de gestão ambiental.', default_audit_type: 'Interna', estimated_duration_hours: 8, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', category: { id: 'cat-1', title: 'Ambiental', color_hex: '#22c55e' } },
      { id: 'at-2', company_id: DEMO_COMPANY_ID, name: 'Auditoria de Conformidade', description: 'Template para auditoria de compliance regulatório.', default_audit_type: 'Externa', estimated_duration_hours: 16, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', category: { id: 'cat-2', title: 'Conformidade', color_hex: '#3b82f6' } },
      { id: 'at-3', company_id: DEMO_COMPANY_ID, name: 'Auditoria ISO 45001', description: 'Template para auditoria de saúde e segurança no trabalho.', default_audit_type: 'Interna', estimated_duration_hours: 12, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', category: { id: 'cat-3', title: 'SST', color_hex: '#f59e0b' } },
    ],
  },
  // ISO requirements — ISORequirementsLibrary.tsx (via useISORequirements(standard), queryKey: ['iso-requirements', standard ?? 'all'])
  {
    queryKey: ['iso-requirements', 'all'],
    data: [
      { id: 'ir-1', standard: 'ISO 14001', clause_number: '4.1', clause_title: 'Entendendo a organização e seu contexto', description: 'A organização deve determinar questões internas e externas relevantes para o propósito e direção estratégica que afetam o SGA.', guidance_notes: 'Usar análise SWOT ou PESTLE para identificar questões.', evidence_examples: ['Ata de reunião de análise de contexto', 'Relatório SWOT'] },
      { id: 'ir-2', standard: 'ISO 14001', clause_number: '6.1.2', clause_title: 'Aspectos Ambientais', description: 'A organização deve determinar os aspectos ambientais de suas atividades, produtos e serviços em condições normais, anormais e de emergência.', guidance_notes: 'Critérios de significância devem ser documentados.', evidence_examples: ['Planilha de LAIA', 'Critérios de significância'] },
      { id: 'ir-3', standard: 'ISO 9001', clause_number: '8.1', clause_title: 'Planejamento e controle operacional', description: 'A organização deve planejar, implementar, controlar, monitorar e analisar os processos necessários para atender requisitos de produtos e serviços.', guidance_notes: 'Documentar critérios de processo e controles de saída.', evidence_examples: ['Procedimentos operacionais padrão', 'Planos de controle'] },
      { id: 'ir-4', standard: 'ISO 45001', clause_number: '6.1.2', clause_title: 'Identificação de perigos e avaliação de riscos', description: 'A organização deve estabelecer processos para identificação contínua de perigos e avaliação de riscos de SSO.', guidance_notes: 'Incluir atividades de rotina, não-rotina e situações de emergência.', evidence_examples: ['Mapa de riscos de SST', 'APR - Análise Preliminar de Riscos'] },
    ],
  },
  {
    queryKey: ['iso-requirements', 'ISO 14001'],
    data: [
      { id: 'ir-1', standard: 'ISO 14001', clause_number: '4.1', clause_title: 'Entendendo a organização e seu contexto', description: 'A organização deve determinar questões internas e externas relevantes para o SGA.', guidance_notes: 'Usar análise SWOT ou PESTLE.', evidence_examples: ['Ata de análise de contexto', 'Relatório SWOT'] },
      { id: 'ir-2', standard: 'ISO 14001', clause_number: '6.1.2', clause_title: 'Aspectos Ambientais', description: 'A organização deve determinar os aspectos ambientais de suas atividades, produtos e serviços.', guidance_notes: 'Avaliar em condições normais, anormais e de emergência.', evidence_examples: ['Planilha de LAIA', 'Critérios de significância'] },
    ],
  },
  {
    queryKey: ['iso-requirements', 'ISO 9001'],
    data: [
      { id: 'ir-3', standard: 'ISO 9001', clause_number: '8.1', clause_title: 'Planejamento e controle operacional', description: 'A organização deve planejar e controlar os processos necessários para produtos e serviços.', guidance_notes: 'Documentar critérios de processo.', evidence_examples: ['Procedimentos operacionais', 'Planos de controle'] },
    ],
  },
  {
    queryKey: ['iso-requirements', 'ISO 45001'],
    data: [
      { id: 'ir-4', standard: 'ISO 45001', clause_number: '6.1.2', clause_title: 'Identificação de perigos e avaliação de riscos', description: 'A organização deve identificar perigos e avaliar riscos de SSO continuamente.', guidance_notes: 'Incluir atividades de rotina e não-rotina.', evidence_examples: ['Mapa de riscos', 'APR - Análise Preliminar de Riscos'] },
    ],
  },
  // Auditor profiles — AuditorsManagement.tsx (queryKey: ['auditor-profiles'])
  {
    queryKey: ['auditor-profiles'],
    data: [
      { id: 'aud-1', company_id: DEMO_COMPANY_ID, qualification_level: 'Lead Auditor', certifications: ['ISO 14001 Lead Auditor', 'ISO 9001 Lead Auditor'], standards_competent: ['ISO 14001', 'ISO 9001'], audit_hours_completed: 480, created_at: '2024-03-01T09:00:00Z', updated_at: '2026-01-10T10:00:00Z', user: { id: 'emp-2', full_name: 'Carlos Santos' } },
      { id: 'aud-2', company_id: DEMO_COMPANY_ID, qualification_level: 'Internal Auditor', certifications: ['ISO 45001 Internal Auditor'], standards_competent: ['ISO 45001', 'NR-12'], audit_hours_completed: 160, created_at: '2024-05-15T09:00:00Z', updated_at: '2026-01-10T10:00:00Z', user: { id: 'emp-4', full_name: 'Rodrigo Lima' } },
    ],
  },
  // Communications — StakeholderCommunicationHub.tsx (queryKey: ['communications', filterType, filterStatus, searchTerm])
  { queryKey: ['communications', 'all', 'all', ''], data: [] },
  { queryKey: ['communications', 'todas', 'todas', ''], data: [] },
  { queryKey: ['communications', '', '', ''], data: [] },
  { queryKey: ['communications'], data: [] },
  // Communication templates — StakeholderCommunicationHub.tsx (queryKey: ['communication-templates'])
  {
    queryKey: ['communication-templates'],
    data: [
      { id: 'cmt-1', name: 'Relatório de Progresso ESG', type: 'email', subject: 'Atualização de Indicadores ESG', body: 'Prezados stakeholders,\n\nSegue resumo dos indicadores ESG do período...', category: 'report', created_at: '2025-10-01T09:00:00Z', variables: ['PERIODO', 'INDICADOR_1', 'INDICADOR_2', 'REMETENTE'] },
      { id: 'cmt-2', name: 'Convite para Reunião de Engajamento', type: 'email', subject: 'Convite: Reunião de Engajamento de Partes Interessadas', body: 'Convidamos para a reunião de engajamento...', category: 'meeting', created_at: '2025-10-01T09:00:00Z', variables: ['NOME_STAKEHOLDER', 'DATA', 'HORARIO', 'LOCAL', 'REMETENTE'] },
    ],
  },
  // Stakeholders for communication — StakeholderCommunicationHub.tsx (queryKey: ['stakeholders-for-communication'])
  {
    queryKey: ['stakeholders-for-communication'],
    data: DEMO_STAKEHOLDERS,
  },
  // Strategic initiatives — StrategicInitiatives.tsx (queryKey: ['strategic-initiatives'])
  {
    queryKey: ['strategic-initiatives'],
    data: [
      { id: 'si-1', title: 'Programa de Neutralidade de Carbono', description: 'Conjunto de ações para alcançar emissões líquidas zero até 2030.', status: 'in_progress', priority: 'high', budget: 1500000, start_date: '2026-01-01T00:00:00Z', end_date: '2030-12-31T00:00:00Z', progress_percentage: 22, created_at: '2025-12-01T09:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
      { id: 'si-2', title: 'Certificação ISO 14001 e 45001', description: 'Implantação e certificação dos sistemas de gestão ambiental e de segurança.', status: 'in_progress', priority: 'high', budget: 350000, start_date: '2026-01-15T00:00:00Z', end_date: '2026-06-30T00:00:00Z', progress_percentage: 65, created_at: '2025-12-01T09:00:00Z', updated_at: '2026-02-15T10:00:00Z' },
      { id: 'si-3', title: 'Programa de Diversidade e Inclusão', description: 'Iniciativas de DEI nos processos de seleção e desenvolvimento de liderança.', status: 'planning', priority: 'medium', budget: 180000, start_date: '2026-03-01T00:00:00Z', end_date: '2026-12-31T00:00:00Z', progress_percentage: 10, created_at: '2026-01-10T09:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
    ],
  },
  // Strategic metrics — StrategicDashboard.tsx (queryKey: ['strategic-metrics'])
  {
    queryKey: ['strategic-metrics'],
    data: {
      strategicMaps: 2,
      activeOKRs: 3,
      completedOKRs: 1,
      swotAnalyses: 1,
      objectives: 8,
      averageProgress: 52,
    },
  },
  // Recent OKRs — StrategicDashboard.tsx (queryKey: ['recent-okrs'])
  {
    queryKey: ['recent-okrs'],
    data: [
      { id: 'okr-demo-1', title: 'Neutralidade de Carbono até 2030', status: 'active', progress_percentage: 22, quarter: 'Q1', year: '2026' },
      { id: 'okr-demo-2', title: 'Certificação ISO 14001', status: 'active', progress_percentage: 65, quarter: 'Q2', year: '2026' },
      { id: 'okr-demo-3', title: 'Zero Acidente Fatal', status: 'active', progress_percentage: 100, quarter: 'Q1', year: '2026' },
    ],
  },
  // Upcoming key results — StrategicDashboard.tsx (queryKey: ['upcoming-key-results'])
  {
    queryKey: ['upcoming-key-results'],
    data: [
      { id: 'kr-3', title: 'Concluir auditoria de pré-certificação', due_date: '2026-03-31T00:00:00Z', progress_percentage: 100, status: 'completed', okrs: { title: 'Certificação ISO 14001' } },
      { id: 'kr-1', title: 'Reduzir emissões Escopo 1 em 20%', due_date: '2026-12-31T00:00:00Z', progress_percentage: 22, status: 'in_progress', okrs: { title: 'Neutralidade de Carbono até 2030' } },
    ],
  },
];
