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
  {
    queryKey: ['governance-metrics', DEMO_COMPANY_ID],
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
  // Board members
  {
    queryKey: ['board-members'],
    data: [
      { id: 'bm-1', name: 'João Batista', role: 'Presidente do Conselho', independence: 'Independente', gender: 'Masculino' },
      { id: 'bm-2', name: 'Carla Dias', role: 'Conselheira', independence: 'Independente', gender: 'Feminino' },
      { id: 'bm-3', name: 'Roberto Almeida', role: 'Conselheiro', independence: 'Não Independente', gender: 'Masculino' },
    ]
  },
  // Whistleblower reports
  {
    queryKey: ['whistleblower-reports'],
    data: [
      { id: 'wr-1', category: 'Assédio Moral', status: 'Resolvido', date: '2026-01-15', count: 1 },
      { id: 'wr-2', category: 'Conflito de Interesses', status: 'Em Investigação', date: '2026-02-10', count: 1 },
    ]
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
  {
    queryKey: ['governance-dashboard', DEMO_COMPANY_ID],
    data: {
      totalRisks: 8,
      criticalRisks: 2,
      complianceRate: 94.5,
      pendingAudits: 1,
      stakeholderEngagement: 72,
    },
  },
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
  // ESG Risks
  {
    queryKey: ['esg-risks', DEMO_COMPANY_ID],
    data: [
      { id: '1', risk_name: 'Vazamento de Efluentes', category: 'Ambiental', probability: 'Média', impact: 'Alto', inherent_risk_level: 'Alto', status: 'Ativo', responsible_user_id: 'emp-2', treatment_plan: 'Manutenção preventiva dos sistemas de tratamento', company_id: DEMO_COMPANY_ID },
      { id: '2', risk_name: 'Descumprimento NR-12', category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', responsible_user_id: 'emp-4', treatment_plan: 'Programa de adequação de máquinas', company_id: DEMO_COMPANY_ID },
      { id: '3', risk_name: 'Fraude Contábil', category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', responsible_user_id: 'emp-5', treatment_plan: 'Auditoria interna periódica', company_id: DEMO_COMPANY_ID },
      { id: '4', risk_name: 'Multas Ambientais', category: 'Ambiental', probability: 'Alta', impact: 'Alto', inherent_risk_level: 'Crítico', status: 'Ativo', responsible_user_id: 'emp-2', treatment_plan: 'Monitoramento contínuo de parâmetros', company_id: DEMO_COMPANY_ID },
      { id: '5', risk_name: 'Interrupção de Fornecimento', category: 'Operacional', probability: 'Média', impact: 'Médio', inherent_risk_level: 'Médio', status: 'Ativo', responsible_user_id: 'emp-1', treatment_plan: 'Diversificação de fornecedores', company_id: DEMO_COMPANY_ID },
      { id: '6', risk_name: 'Violação LGPD', category: 'Governança', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Médio', status: 'Ativo', responsible_user_id: 'emp-7', treatment_plan: 'Programa de adequação LGPD', company_id: DEMO_COMPANY_ID },
      { id: '7', risk_name: 'Acidente de Trabalho Fatal', category: 'Social', probability: 'Baixa', impact: 'Alto', inherent_risk_level: 'Crítico', status: 'Ativo', responsible_user_id: 'emp-4', treatment_plan: 'Programa Zero Acidentes', company_id: DEMO_COMPANY_ID },
      { id: '8', risk_name: 'Escassez Hídrica', category: 'Ambiental', probability: 'Média', impact: 'Médio', inherent_risk_level: 'Médio', status: 'Ativo', responsible_user_id: 'emp-2', treatment_plan: 'Sistema de reuso de água', company_id: DEMO_COMPANY_ID },
    ],
  },
  // ESG Risks (base)
  {
    queryKey: ['esg-risks'],
    data: [
      { id: '1', risk_name: 'Vazamento de Efluentes', category: 'Ambiental', inherent_risk_level: 'Alto', status: 'Ativo' },
      { id: '4', risk_name: 'Multas Ambientais', category: 'Ambiental', inherent_risk_level: 'Crítico', status: 'Ativo' },
    ],
  },
  // Compliance
  {
    queryKey: ['compliance', DEMO_COMPANY_ID],
    data: [
      { id: '1', name: 'LGPD - Lei Geral de Proteção de Dados', category: 'Dados e Privacidade', status: 'Conforme', compliance_percentage: 92, last_review: '2026-01-15', next_review: '2026-07-15', company_id: DEMO_COMPANY_ID },
      { id: '2', name: 'ISO 14001:2015', category: 'Ambiental', status: 'Conforme', compliance_percentage: 88, last_review: '2025-12-01', next_review: '2026-06-01', company_id: DEMO_COMPANY_ID },
      { id: '3', name: 'NR-12 - Segurança em Máquinas', category: 'Segurança', status: 'Parcialmente Conforme', compliance_percentage: 78, last_review: '2026-01-20', next_review: '2026-04-20', company_id: DEMO_COMPANY_ID },
      { id: '4', name: 'Política Anticorrupção', category: 'Governança', status: 'Conforme', compliance_percentage: 95, last_review: '2025-11-01', next_review: '2026-05-01', company_id: DEMO_COMPANY_ID },
      { id: '5', name: 'CONAMA 430 - Efluentes', category: 'Ambiental', status: 'Conforme', compliance_percentage: 100, last_review: '2026-02-01', next_review: '2026-08-01', company_id: DEMO_COMPANY_ID },
    ],
  },
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
    queryKey: ['compliance-tasks', DEMO_COMPANY_ID],
    data: [
      { id: 'ct-1', title: 'Renovar Licença de Operação', requirement: 'Condicionantes Ambientais', category: 'Environmental', due_date: '2026-03-15', status: 'Em progresso', priority: 'high', assigned_to_user_id: 'emp-2', is_template: false, is_recurring: true, recurrence_pattern: 'yearly', company_id: DEMO_COMPANY_ID, requirement_id: 'req-1' },
      { id: 'ct-2', title: 'Treinamento LGPD Anual', requirement: 'Política de Privacidade', category: 'Data & Privacy', due_date: '2026-02-28', status: 'Atrasado', priority: 'medium', assigned_to_user_id: 'emp-7', is_template: false, is_recurring: true, recurrence_pattern: 'yearly', company_id: DEMO_COMPANY_ID, requirement_id: 'req-2' },
      { id: 'ct-3', title: 'Relatório Trimestral CIPA', requirement: 'NR-05', category: 'Health & Safety', due_date: '2026-03-30', status: 'Pendente', priority: 'medium', assigned_to_user_id: 'emp-4', is_template: false, is_recurring: true, recurrence_pattern: 'quarterly', company_id: DEMO_COMPANY_ID, requirement_id: 'req-3' }
    ]
  },
  {
    queryKey: ['compliance-tasks'],
    data: [
      { id: 'ct-1', title: 'Renovar Licença de Operação', requirement: 'Condicionantes Ambientais', category: 'Environmental', due_date: '2026-03-15', status: 'Em progresso', priority: 'high', is_template: false },
      { id: 'ct-2', title: 'Treinamento LGPD Anual', requirement: 'Política de Privacidade', category: 'Data & Privacy', due_date: '2026-02-28', status: 'Atrasado', priority: 'medium', is_template: false },
    ]
  },
  // Licenses
  {
    queryKey: ['licenses', DEMO_COMPANY_ID],
    data: [
      { id: 'lic-1', name: 'Licença de Operação (LO)', issuing_body: 'CETESB', issue_date: '2021-03-15', expiration_date: '2026-03-15', status: 'Válida', company_id: DEMO_COMPANY_ID },
      { id: 'lic-2', name: 'Alvará do Corpo de Bombeiros (AVCB)', issuing_body: 'Corpo de Bombeiros SP', issue_date: '2023-05-10', expiration_date: '2026-05-10', status: 'Válida', company_id: DEMO_COMPANY_ID },
      { id: 'lic-3', name: 'Outorga de Uso de Água', issuing_body: 'DAEE', issue_date: '2019-11-20', expiration_date: '2024-11-20', status: 'Vencida', company_id: DEMO_COMPANY_ID },
    ]
  },
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
      { id: '1', title: 'Política de Sustentabilidade', category: 'ESG', status: 'Ativo', version: '3.0', approval_date: '2025-06-15', next_review: '2026-06-15' },
      { id: '2', title: 'Código de Ética', category: 'Governança', status: 'Ativo', version: '5.1', approval_date: '2025-01-01', next_review: '2026-01-01' },
      { id: '3', title: 'Política Anticorrupção', category: 'Compliance', status: 'Ativo', version: '2.0', approval_date: '2024-12-01', next_review: '2025-12-01' },
    ],
  },
  // Corporate policies (base)
  {
    queryKey: ['corporate-policies'],
    data: [
      { id: '1', title: 'Política de Sustentabilidade', category: 'ESG', status: 'Ativo' },
      { id: '2', title: 'Código de Ética', category: 'Governança', status: 'Ativo' },
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
      { id: '1', title: 'Créditos de Carbono', category: 'Financeiro', status: 'Em Análise', potential_value: 500000 },
      { id: '2', title: 'Certificação B Corp', category: 'Reputação', status: 'Identificada', potential_value: null },
    ],
  },
  // Opportunities (base)
  {
    queryKey: ['opportunities'],
    data: [
      { id: '1', title: 'Créditos de Carbono', category: 'Financeiro', status: 'Em Análise', potential_value: 500000 },
    ],
  },
  // Risk matrix
  {
    queryKey: ['risk-matrix'],
    data: {
      rows: ['Baixa', 'Média', 'Alta'],
      cols: ['Baixo', 'Médio', 'Alto'],
      cells: [
        { probability: 'Baixa', impact: 'Baixo', risks: 0, level: 'Baixo' },
        { probability: 'Baixa', impact: 'Médio', risks: 0, level: 'Baixo' },
        { probability: 'Baixa', impact: 'Alto', risks: 3, level: 'Médio' },
        { probability: 'Média', impact: 'Baixo', risks: 0, level: 'Baixo' },
        { probability: 'Média', impact: 'Médio', risks: 2, level: 'Médio' },
        { probability: 'Média', impact: 'Alto', risks: 1, level: 'Alto' },
        { probability: 'Alta', impact: 'Baixo', risks: 0, level: 'Baixo' },
        { probability: 'Alta', impact: 'Médio', risks: 0, level: 'Médio' },
        { probability: 'Alta', impact: 'Alto', risks: 2, level: 'Crítico' },
      ],
    },
  },
];
