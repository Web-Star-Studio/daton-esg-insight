/**
 * Mock data for Governance modules (risks, compliance, audits, stakeholders)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const governanceMockEntries = [
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
    data: [
      { id: '1', name: 'Comunidade Local', type: 'Comunidade', influence_level: 'Alta', interest_level: 'Alta', engagement_strategy: 'Diálogo permanente', last_engagement: '2026-01-20', company_id: DEMO_COMPANY_ID },
      { id: '2', name: 'IBAMA', type: 'Regulador', influence_level: 'Muito Alta', interest_level: 'Alta', engagement_strategy: 'Conformidade e relatórios', last_engagement: '2026-02-01', company_id: DEMO_COMPANY_ID },
      { id: '3', name: 'Investidores ESG', type: 'Investidor', influence_level: 'Alta', interest_level: 'Muito Alta', engagement_strategy: 'Relatórios de sustentabilidade', last_engagement: '2025-12-15', company_id: DEMO_COMPANY_ID },
      { id: '4', name: 'Fornecedores Críticos', type: 'Parceiro', influence_level: 'Média', interest_level: 'Alta', engagement_strategy: 'Programa de desenvolvimento', last_engagement: '2026-01-10', company_id: DEMO_COMPANY_ID },
      { id: '5', name: 'Sindicato dos Trabalhadores', type: 'Sindicato', influence_level: 'Alta', interest_level: 'Alta', engagement_strategy: 'Negociação coletiva', last_engagement: '2025-11-30', company_id: DEMO_COMPANY_ID },
      { id: '6', name: 'ONGs Ambientais', type: 'ONG', influence_level: 'Média', interest_level: 'Alta', engagement_strategy: 'Parcerias em projetos', last_engagement: '2026-01-25', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Stakeholders (base)
  {
    queryKey: ['stakeholders'],
    data: [
      { id: '1', name: 'Comunidade Local', type: 'Comunidade', influence_level: 'Alta' },
      { id: '2', name: 'IBAMA', type: 'Regulador', influence_level: 'Muito Alta' },
    ],
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
