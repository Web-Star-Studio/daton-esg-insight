/**
 * Mock data for Quality (SGQ) modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_NON_CONFORMITY_DETAILS: Record<string, any> = {
  '1': {
    id: '1',
    nc_number: 'NC-2026-001',
    title: 'Desvio de temperatura na câmara fria',
    description: 'Temperatura acima do limite operacional por 2 horas durante turno noturno.',
    category: 'Processo',
    severity: 'Maior',
    source: 'Auditoria Interna',
    detected_date: '2026-01-05',
    status: 'Em Tratamento',
    created_at: '2026-01-05T08:30:00Z',
    damage_level: 'Médio',
    impact_analysis: 'Risco de perda de lote e não atendimento de requisitos de qualidade.',
    root_cause_analysis: 'Falha no plano de manutenção preventiva do sistema de refrigeração.',
    corrective_actions: 'Substituição de sensor e revisão do plano de inspeção diária.',
    preventive_actions: 'Treinamento da equipe e checklist digital com alertas.',
    effectiveness_evaluation: 'Ações em implementação com monitoramento semanal.',
    effectiveness_date: null,
    responsible_user_id: 'emp-8',
    approved_by_user_id: 'demo-user-002',
    approval_date: '2026-01-08T10:00:00Z',
    approval_notes: 'Aprovado para execução imediata.',
    attachments: [],
    due_date: '2026-03-01',
    completion_date: null,
    recurrence_count: 1,
    responsible: { id: 'emp-8', full_name: 'Lucas Mendes' },
    approved_by: { id: 'demo-user-002', full_name: 'Mariana Lopes' },
  },
  '2': {
    id: '2',
    nc_number: 'NC-2026-002',
    title: 'Documento de procedimento desatualizado',
    description: 'PO-005 estava sem revisão há mais de 18 meses.',
    category: 'Documentação',
    severity: 'Menor',
    source: 'Inspeção',
    detected_date: '2026-01-12',
    status: 'Aberta',
    created_at: '2026-01-12T11:00:00Z',
    damage_level: 'Baixo',
    impact_analysis: 'Risco de uso de versão obsoleta de instruções.',
    root_cause_analysis: 'Ausência de gatilho automático para revisão documental.',
    corrective_actions: 'Atualização do procedimento e republicação no SGQ.',
    preventive_actions: 'Agenda automática de revisão semestral.',
    effectiveness_evaluation: null,
    effectiveness_date: null,
    responsible_user_id: 'emp-6',
    approved_by_user_id: null,
    approval_date: null,
    approval_notes: null,
    attachments: [],
    due_date: '2026-03-20',
    completion_date: null,
    recurrence_count: 0,
    responsible: { id: 'emp-6', full_name: 'Pedro Almeida' },
    approved_by: null,
  },
  '3': {
    id: '3',
    nc_number: 'NC-2026-003',
    title: 'Falha na calibração de instrumento',
    description: 'Balança analítica fora da faixa de tolerância.',
    category: 'Equipamento',
    severity: 'Crítica',
    source: 'Verificação',
    detected_date: '2026-01-20',
    status: 'Em Análise',
    created_at: '2026-01-20T14:10:00Z',
    damage_level: 'Alto',
    impact_analysis: 'Pode comprometer resultados laboratoriais e decisões de qualidade.',
    root_cause_analysis: 'Plano de calibração não executado no prazo.',
    corrective_actions: 'Bloqueio do equipamento e calibração emergencial.',
    preventive_actions: 'Integração com manutenção preditiva e alertas.',
    effectiveness_evaluation: null,
    effectiveness_date: null,
    responsible_user_id: 'emp-6',
    approved_by_user_id: 'demo-user-003',
    approval_date: '2026-01-21T09:20:00Z',
    approval_notes: 'Prioridade máxima aprovada.',
    attachments: [],
    due_date: '2026-02-20',
    completion_date: null,
    recurrence_count: 2,
    responsible: { id: 'emp-6', full_name: 'Pedro Almeida' },
    approved_by: { id: 'demo-user-003', full_name: 'Carlos Andrade' },
  },
};

const DEMO_NC_IMMEDIATE_ACTIONS = [
  {
    id: 'ncia-1',
    non_conformity_id: '1',
    description: 'Isolar lote impactado e registrar rastreabilidade.',
    status: 'Concluída',
    responsible: { id: 'emp-8', full_name: 'Lucas Mendes' },
  },
  {
    id: 'ncia-2',
    non_conformity_id: '1',
    description: 'Verificar funcionamento de alarmes e sensores da câmara.',
    status: 'Em Andamento',
    responsible: { id: 'emp-6', full_name: 'Pedro Almeida' },
  },
];

const DEMO_NC_CAUSE_ANALYSIS = {
  id: 'ncca-1',
  non_conformity_id: '1',
  analysis_method: '5_whys',
  root_cause: 'Falta de inspeção preventiva no sistema de refrigeração.',
  five_whys_data: [
    { pergunta: 'Por que a temperatura subiu?', resposta: 'Falha no sensor principal.' },
    { pergunta: 'Por que o sensor falhou?', resposta: 'Desgaste sem troca preventiva.' },
    { pergunta: 'Por que não houve troca preventiva?', resposta: 'Plano de manutenção não revisado.' },
    { pergunta: 'Por que o plano não foi revisado?', resposta: 'Ausência de gatilho no sistema.' },
    { pergunta: 'Por que não há gatilho?', resposta: 'Processo não estava digitalizado.' },
  ],
};

const DEMO_NC_ACTION_PLANS = [
  {
    id: 'ncap-1',
    non_conformity_id: '1',
    status: 'Em Execução',
    what_action: 'Substituir sensor e validar leitura por 7 dias',
    why_reason: 'Eliminar causa imediata do desvio',
    who_responsible: { id: 'emp-6', full_name: 'Pedro Almeida' },
    when_deadline: '2026-02-28',
  },
  {
    id: 'ncap-2',
    non_conformity_id: '1',
    status: 'Planejada',
    what_action: 'Implantar checklist digital com alarme',
    why_reason: 'Prevenir recorrência operacional',
    who_responsible: { id: 'emp-8', full_name: 'Lucas Mendes' },
    when_deadline: '2026-03-10',
  },
];

const DEMO_NC_EFFECTIVENESS = {
  id: 'ncef-1',
  non_conformity_id: '1',
  is_effective: true,
  evaluated_at: '2026-02-15',
  risk_update_notes: 'Risco residual reduzido para nível baixo após 30 dias sem recorrência.',
};

export const qualityMockEntries = [
  // Quality Dashboard
  {
    queryKey: ['quality', 'dashboard', DEMO_COMPANY_ID],
    data: {
      totalIndicators: 10,
      onTarget: 7,
      offTarget: 2,
      noData: 1,
      totalNCs: 8,
      openNCs: 3,
      correctiveActions: 5,
      completedActions: 3,
      overallScore: 87.3,
    },
  },
  // Quality indicators
  {
    queryKey: ['quality-indicators', DEMO_COMPANY_ID],
    data: [
      { id: '1', name: 'Índice de Retrabalho', code: 'IND-001', target_value: 2.0, current_value: 1.8, unit: '%', status: 'No Alvo', frequency: 'Mensal', responsible: 'Pedro Almeida', company_id: DEMO_COMPANY_ID },
      { id: '2', name: 'Satisfação do Cliente', code: 'IND-002', target_value: 85, current_value: 88.5, unit: '%', status: 'No Alvo', frequency: 'Trimestral', responsible: 'Ana Silva', company_id: DEMO_COMPANY_ID },
      { id: '3', name: 'Tempo Médio de Resolução NC', code: 'IND-003', target_value: 15, current_value: 12, unit: 'dias', status: 'No Alvo', frequency: 'Mensal', responsible: 'Pedro Almeida', company_id: DEMO_COMPANY_ID },
      { id: '4', name: 'Taxa de Conformidade', code: 'IND-004', target_value: 95, current_value: 94.5, unit: '%', status: 'Fora do Alvo', frequency: 'Mensal', responsible: 'Fernanda Rocha', company_id: DEMO_COMPANY_ID },
      { id: '5', name: 'Eficácia de Treinamentos', code: 'IND-005', target_value: 80, current_value: 82, unit: '%', status: 'No Alvo', frequency: 'Semestral', responsible: 'Mariana Costa', company_id: DEMO_COMPANY_ID },
      { id: '6', name: 'Índice de Reclamações', code: 'IND-006', target_value: 5, current_value: 3, unit: 'un/mês', status: 'No Alvo', frequency: 'Mensal', responsible: 'Ana Silva', company_id: DEMO_COMPANY_ID },
      { id: '7', name: 'OEE - Eficiência Global', code: 'IND-007', target_value: 85, current_value: 81, unit: '%', status: 'Fora do Alvo', frequency: 'Mensal', responsible: 'Lucas Mendes', company_id: DEMO_COMPANY_ID },
      { id: '8', name: 'Taxa de Defeitos', code: 'IND-008', target_value: 1.0, current_value: 0.8, unit: '%', status: 'No Alvo', frequency: 'Semanal', responsible: 'Pedro Almeida', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Quality indicators (base)
  {
    queryKey: ['quality-indicators'],
    data: [
      { id: '1', name: 'Índice de Retrabalho', code: 'IND-001', target_value: 2.0, current_value: 1.8, unit: '%', status: 'No Alvo' },
      { id: '2', name: 'Satisfação do Cliente', code: 'IND-002', target_value: 85, current_value: 88.5, unit: '%', status: 'No Alvo' },
    ],
  },
  // Non-conformities
  {
    queryKey: ['quality', 'non-conformities', DEMO_COMPANY_ID],
    data: [
      { id: '1', nc_number: 'NC-2026-001', title: 'Desvio de temperatura na câmara fria', category: 'Processo', severity: 'Maior', status: 'Em Tratamento', origin: 'Auditoria Interna', department: 'Produção', responsible_user_id: 'emp-8', description: 'Temperatura acima do limite por 2h', created_at: '2026-01-05', company_id: DEMO_COMPANY_ID },
      { id: '2', nc_number: 'NC-2026-002', title: 'Documento de procedimento desatualizado', category: 'Documentação', severity: 'Menor', status: 'Aberta', origin: 'Inspeção', department: 'Qualidade', responsible_user_id: 'emp-6', description: 'PO-005 sem revisão há 18 meses', created_at: '2026-01-12', company_id: DEMO_COMPANY_ID },
      { id: '3', nc_number: 'NC-2026-003', title: 'Falha na calibração de instrumento', category: 'Equipamento', severity: 'Crítica', status: 'Em Análise', origin: 'Verificação', department: 'Laboratório', responsible_user_id: 'emp-6', description: 'Balança analítica fora de tolerância', created_at: '2026-01-20', company_id: DEMO_COMPANY_ID },
      { id: '4', nc_number: 'NC-2025-015', title: 'Treinamento obrigatório não realizado', category: 'Pessoas', severity: 'Menor', status: 'Concluída', origin: 'Auditoria', department: 'RH', responsible_user_id: 'emp-3', description: '5 colaboradores sem NR-35', created_at: '2025-11-10', company_id: DEMO_COMPANY_ID },
      { id: '5', nc_number: 'NC-2025-014', title: 'Produto não conforme liberado', category: 'Produto', severity: 'Maior', status: 'Concluída', origin: 'Reclamação Cliente', department: 'Produção', responsible_user_id: 'emp-8', description: 'Lote 2025-120 com defeito visual', created_at: '2025-10-25', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Non-conformities (base)
  {
    queryKey: ['non-conformities'],
    data: [
      { id: '1', nc_number: 'NC-2026-001', title: 'Desvio de temperatura na câmara fria', category: 'Processo', severity: 'Maior', status: 'Em Tratamento' },
      { id: '2', nc_number: 'NC-2026-002', title: 'Documento desatualizado', category: 'Documentação', severity: 'Menor', status: 'Aberta' },
      { id: '3', nc_number: 'NC-2026-003', title: 'Falha na calibração', category: 'Equipamento', severity: 'Crítica', status: 'Em Análise' },
    ],
  },
  // Non-conformity details and lifecycle data
  {
    queryKey: ['non-conformity'],
    data: DEMO_NON_CONFORMITY_DETAILS['1'],
  },
  {
    queryKey: ['non-conformity', '1'],
    data: DEMO_NON_CONFORMITY_DETAILS['1'],
  },
  {
    queryKey: ['non-conformity', '2'],
    data: DEMO_NON_CONFORMITY_DETAILS['2'],
  },
  {
    queryKey: ['non-conformity', '3'],
    data: DEMO_NON_CONFORMITY_DETAILS['3'],
  },
  {
    queryKey: ['nc-immediate-actions-modal'],
    data: DEMO_NC_IMMEDIATE_ACTIONS,
  },
  {
    queryKey: ['nc-cause-analysis-modal'],
    data: DEMO_NC_CAUSE_ANALYSIS,
  },
  {
    queryKey: ['nc-action-plans-modal'],
    data: DEMO_NC_ACTION_PLANS,
  },
  {
    queryKey: ['nc-effectiveness-modal'],
    data: DEMO_NC_EFFECTIVENESS,
  },
  // NC Dashboard stats
  {
    queryKey: ['nc-dashboard-stats'],
    data: {
      totalNCs: 8,
      openNCs: 3,
      closedNCs: 5,
      criticalNCs: 1,
      avgResolutionDays: 12,
      onTimeRate: 85.7,
      byCategory: [
        { category: 'Processo', count: 2 },
        { category: 'Documentação', count: 2 },
        { category: 'Equipamento', count: 1 },
        { category: 'Pessoas', count: 1 },
        { category: 'Produto', count: 2 },
      ],
      bySeverity: [
        { severity: 'Crítica', count: 1 },
        { severity: 'Maior', count: 3 },
        { severity: 'Menor', count: 4 },
      ],
    },
  },
  // Corrective actions
  {
    queryKey: ['quality', 'corrective-actions', DEMO_COMPANY_ID],
    data: [
      { id: '1', action_number: 'AC-2026-001', title: 'Instalar alarme de temperatura', nc_id: '1', status: 'Em Execução', responsible: 'Lucas Mendes', deadline: '2026-02-28', progress: 65, company_id: DEMO_COMPANY_ID },
      { id: '2', action_number: 'AC-2026-002', title: 'Revisar e atualizar PO-005', nc_id: '2', status: 'Planejada', responsible: 'Pedro Almeida', deadline: '2026-03-15', progress: 0, company_id: DEMO_COMPANY_ID },
      { id: '3', action_number: 'AC-2026-003', title: 'Calibrar e qualificar balança', nc_id: '3', status: 'Em Execução', responsible: 'Pedro Almeida', deadline: '2026-02-15', progress: 40, company_id: DEMO_COMPANY_ID },
      { id: '4', action_number: 'AC-2025-012', title: 'Realizar treinamento NR-35', nc_id: '4', status: 'Concluída', responsible: 'Mariana Costa', deadline: '2025-12-15', progress: 100, company_id: DEMO_COMPANY_ID },
      { id: '5', action_number: 'AC-2025-011', title: 'Implementar inspeção visual reforçada', nc_id: '5', status: 'Concluída', responsible: 'Lucas Mendes', deadline: '2025-11-30', progress: 100, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Corrective actions (base)
  {
    queryKey: ['corrective-actions'],
    data: [
      { id: '1', action_number: 'AC-2026-001', title: 'Instalar alarme de temperatura', status: 'Em Execução', progress: 65 },
      { id: '2', action_number: 'AC-2026-002', title: 'Revisar e atualizar PO-005', status: 'Planejada', progress: 0 },
    ],
  },
  // Processes
  {
    queryKey: ['quality', 'processes', DEMO_COMPANY_ID],
    data: [
      { id: '1', name: 'Recebimento de Matéria-Prima', category: 'Operacional', owner: 'Ana Silva', status: 'Documentado', last_review: '2025-12-01', version: '4.2', company_id: DEMO_COMPANY_ID },
      { id: '2', name: 'Controle de Qualidade', category: 'Suporte', owner: 'Pedro Almeida', status: 'Documentado', last_review: '2026-01-15', version: '3.1', company_id: DEMO_COMPANY_ID },
      { id: '3', name: 'Expedição e Logística', category: 'Operacional', owner: 'Lucas Mendes', status: 'Em Revisão', last_review: '2025-10-01', version: '2.5', company_id: DEMO_COMPANY_ID },
      { id: '4', name: 'Gestão de Fornecedores', category: 'Suporte', owner: 'Ana Silva', status: 'Documentado', last_review: '2025-11-20', version: '3.0', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Process maps
  {
    queryKey: ['processMaps'],
    data: [
      { id: 'pm-1', name: 'Mapa de Processo - Produção', description: 'Fluxo completo do processo produtivo', status: 'Ativo', version: '2.1', owner: 'Lucas Mendes', last_review: '2026-01-15' },
      { id: 'pm-2', name: 'Mapa de Processo - Qualidade', description: 'Fluxo de inspeção e controle de qualidade', status: 'Ativo', version: '3.0', owner: 'Pedro Almeida', last_review: '2025-12-01' },
      { id: 'pm-3', name: 'Mapa de Processo - Logística', description: 'Fluxo de recebimento e expedição', status: 'Em Revisão', version: '1.5', owner: 'Ana Silva', last_review: '2025-10-01' },
    ],
  },
  // Strategic maps
  {
    queryKey: ['strategic-maps'],
    data: [
      { id: 'sm-1', title: 'Mapa Estratégico 2025-2027', perspectives: ['Financeira', 'Clientes', 'Processos', 'Aprendizado'], objectives_count: 16, status: 'Ativo' },
      { id: 'sm-2', title: 'BSC - Sustentabilidade', perspectives: ['Ambiental', 'Social', 'Governança'], objectives_count: 12, status: 'Ativo' },
    ],
  },
  // Strategic planning
  {
    queryKey: ['strategic-planning', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Plano Estratégico 2025-2027', status: 'Ativo', objectives_count: 12, completed_objectives: 4, progress: 33, company_id: DEMO_COMPANY_ID },
      { id: '2', title: 'PDCA - Redução de Custos', status: 'Em Andamento', objectives_count: 5, completed_objectives: 2, progress: 40, company_id: DEMO_COMPANY_ID },
      { id: '3', title: 'Programa 5S', status: 'Ativo', objectives_count: 8, completed_objectives: 6, progress: 75, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Strategic planning (base)
  {
    queryKey: ['strategic-planning'],
    data: [
      { id: '1', title: 'Plano Estratégico 2025-2027', status: 'Ativo', objectives_count: 12, completed_objectives: 4, progress: 33 },
    ],
  },
  // Controlled documents
  {
    queryKey: ['controlled-documents', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Manual da Qualidade', code: 'MQ-001', category: 'Manual', version: '6.0', status: 'Vigente', review_date: '2026-06-01', responsible: 'Pedro Almeida' },
      { id: '2', title: 'Procedimento de Inspeção', code: 'PO-003', category: 'Procedimento', version: '4.1', status: 'Vigente', review_date: '2026-03-15', responsible: 'Pedro Almeida' },
      { id: '3', title: 'Instrução de Trabalho - Embalagem', code: 'IT-012', category: 'Instrução', version: '2.3', status: 'Vigente', review_date: '2026-08-01', responsible: 'Lucas Mendes' },
      { id: '4', title: 'Formulário de Registro de NC', code: 'FR-005', category: 'Formulário', version: '3.0', status: 'Vigente', review_date: '2026-12-01', responsible: 'Pedro Almeida' },
      { id: '5', title: 'Procedimento Operacional - PO-005', code: 'PO-005', category: 'Procedimento', version: '2.0', status: 'Em Revisão', review_date: '2026-02-28', responsible: 'Pedro Almeida' },
    ],
  },
  // Controlled documents (base)
  {
    queryKey: ['controlled-documents'],
    data: [
      { id: '1', title: 'Manual da Qualidade', code: 'MQ-001', category: 'Manual', version: '6.0', status: 'Vigente' },
      { id: '2', title: 'Procedimento de Inspeção', code: 'PO-003', category: 'Procedimento', version: '4.1', status: 'Vigente' },
    ],
  },
  // LAIA
  {
    queryKey: ['laia-units', DEMO_COMPANY_ID],
    data: [
      { id: '1', name: 'Unidade Industrial SP', branch_id: 'branch-1', total_aspects: 25, significant_aspects: 8, last_review: '2025-12-01' },
      { id: '2', name: 'Centro de Distribuição RJ', branch_id: 'branch-2', total_aspects: 12, significant_aspects: 3, last_review: '2025-11-15' },
    ],
  },
  // LAIA (base)
  {
    queryKey: ['laia-units'],
    data: [
      { id: '1', name: 'Unidade Industrial SP', total_aspects: 25, significant_aspects: 8 },
    ],
  },
  // Action plans
  {
    queryKey: ['action-plans', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'Plano de Ação - Melhoria Contínua Q1 2026', status: 'Em Andamento', items_count: 8, completed_items: 3, company_id: DEMO_COMPANY_ID },
      { id: '2', title: 'Plano de Adequação NR-12', status: 'Em Andamento', items_count: 12, completed_items: 7, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Action plans (base)
  {
    queryKey: ['action-plans'],
    data: [
      { id: '1', title: 'Plano de Ação - Melhoria Contínua Q1 2026', status: 'Em Andamento', items_count: 8, completed_items: 3 },
    ],
  },
  // Audit stats
  {
    queryKey: ['audit-stats'],
    data: {
      totalAudits: 3,
      completedAudits: 2,
      plannedAudits: 1,
      totalFindings: 8,
      openFindings: 3,
      avgScore: 82.5,
    },
  },
  // Knowledge base articles
  {
    queryKey: ['knowledge-articles'],
    data: [
      { id: 'ka-1', title: 'Guia de Boas Práticas Ambientais', category: 'Ambiental', status: 'Publicado', views: 245 },
      { id: 'ka-2', title: 'Procedimento de Resposta a Emergências', category: 'SST', status: 'Publicado', views: 189 },
      { id: 'ka-3', title: 'Manual do Colaborador', category: 'RH', status: 'Publicado', views: 532 },
    ],
  },
  // Quality dashboard (flat key) — AIQualityInsights.tsx (queryKey: ['quality-dashboard'])
  // Note: this is distinct from ['quality', 'dashboard', DEMO_COMPANY_ID]
  {
    queryKey: ['quality-dashboard'],
    data: {
      metrics: { openNCs: 3 },
      recentNCs: [
        { description: 'Temperatura acima do limite operacional por 2 horas durante turno noturno.' },
        { description: 'PO-005 estava sem revisão há mais de 18 meses.' },
        { description: 'Balança analítica fora da faixa de tolerância de calibração.' },
      ],
    },
  },
  // Quality indicators metrics — AIQualityInsights.tsx (queryKey: ['quality-indicators-metrics'])
  {
    queryKey: ['quality-indicators-metrics'],
    data: {
      ncTrend: { change: -15.2 },
      resolutionRate: { percentage: 75.0 },
      overdueActions: 1,
      qualityScore: 87.3,
    },
  },
  // AI insights catch-all — CardWithAI.tsx uses ['ai-insights', cardType, cardData] and expects AIInsight[]
  // Must be [] (array) so CardWithAI doesn't crash calling .filter() on an object.
  // AIQualityInsights uses ['ai-insights', []] which matches the more-specific entry below.
  {
    queryKey: ['ai-insights'],
    data: [],
  },
  {
    queryKey: ['ai-insights', []],
    data: {
      patterns: [],
      predictions: { nextMonthNCs: 0, riskLevel: 'low', efficiency: 90 },
    },
  },
  // NC advanced dashboard — NonConformitiesAdvancedDashboard.tsx (queryKey: ['nc-advanced-dashboard'])
  {
    queryKey: ['nc-advanced-dashboard'],
    data: {
      metrics: {
        total: 8,
        currentMonth: 3,
        lastMonth: 5,
        trend: -40,
        resolutionRate: 62.5,
        overdue: 1,
        avgResolutionTime: 12,
        critical: 1,
      },
      charts: {
        severity: [
          { name: 'Crítica', value: 1 },
          { name: 'Maior', value: 3 },
          { name: 'Menor', value: 4 },
        ],
        status: [
          { name: 'Aberta', value: 2 },
          { name: 'Em Tratamento', value: 1 },
          { name: 'Em Análise', value: 1 },
          { name: 'Concluída', value: 4 },
        ],
        source: [
          { name: 'Auditoria Interna', value: 3 },
          { name: 'Inspeção', value: 2 },
          { name: 'Reclamação Cliente', value: 1 },
          { name: 'Verificação', value: 1 },
          { name: 'Auditoria', value: 1 },
        ],
        monthly: [
          { month: 'Set/25', total: 2, criticas: 0, encerradas: 2 },
          { month: 'Out/25', total: 3, criticas: 1, encerradas: 2 },
          { month: 'Nov/25', total: 1, criticas: 0, encerradas: 1 },
          { month: 'Dez/25', total: 4, criticas: 1, encerradas: 3 },
          { month: 'Jan/26', total: 5, criticas: 1, encerradas: 2 },
          { month: 'Fev/26', total: 3, criticas: 1, encerradas: 1 },
        ],
      },
      recentNCs: [
        { id: '1', status: 'Em Tratamento', severity: 'Maior', source: 'Auditoria Interna', created_at: '2026-01-05T08:30:00Z', due_date: '2026-03-01', completion_date: null },
        { id: '2', status: 'Aberta', severity: 'Menor', source: 'Inspeção', created_at: '2026-01-12T11:00:00Z', due_date: '2026-03-20', completion_date: null },
        { id: '3', status: 'Em Análise', severity: 'Crítica', source: 'Verificação', created_at: '2026-01-20T14:10:00Z', due_date: '2026-02-20', completion_date: null },
      ],
      isEmpty: false,
      companyInfo: { name: 'Daton Demo' },
    },
  },
  // Risk matrix with QualityMatrix shape — QualityMatrix.tsx (queryKey: ['risk-matrix', selectedMatrixId])
  // When selectedMatrixId is '' (initial state, enabled: false), data is still undefined → crash.
  // Add empty-string key so even the disabled state has a safe shape.
  {
    queryKey: ['risk-matrix', ''],
    data: {
      riskCounts: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      matrix: [],
    },
  },
  // The 'rm-1' id comes from ['risk-matrices'] in governanceMocks.ts
  {
    queryKey: ['risk-matrix', 'rm-1'],
    data: {
      riskCounts: { total: 8, critical: 2, high: 2, medium: 3, low: 1 },
      matrix: [
        {
          probability: 'Alta', impact: 'Alto', risks: [
            { id: '4', description: 'Multas Ambientais', category: 'Ambiental' },
            { id: '7', description: 'Acidente de Trabalho Fatal', category: 'Social' },
          ]
        },
        { probability: 'Alta', impact: 'Médio', risks: [] },
        { probability: 'Alta', impact: 'Baixo', risks: [] },
        {
          probability: 'Média', impact: 'Alto', risks: [
            { id: '1', description: 'Vazamento de Efluentes', category: 'Ambiental' },
          ]
        },
        {
          probability: 'Média', impact: 'Médio', risks: [
            { id: '5', description: 'Interrupção de Fornecimento', category: 'Governança' },
            { id: '8', description: 'Escassez Hídrica', category: 'Ambiental' },
          ]
        },
        { probability: 'Média', impact: 'Baixo', risks: [] },
        {
          probability: 'Baixa', impact: 'Alto', risks: [
            { id: '2', description: 'Descumprimento NR-12', category: 'Social' },
            { id: '3', description: 'Fraude Contábil', category: 'Governança' },
            { id: '6', description: 'Violação LGPD', category: 'Governança' },
          ]
        },
        { probability: 'Baixa', impact: 'Médio', risks: [] },
        { probability: 'Baixa', impact: 'Baixo', risks: [] },
      ],
    },
  },
  // Quality Metrics (Dashboard Top Cards)
  {
    queryKey: ['quality-metrics'],
    data: {
      totalNCs: 142,
      openNCs: 18,
      resolvedNCs: 124,
      totalRisks: 45,
      criticalRisks: 3,
      actionPlans: 28,
      overdueActions: 4,
      qualityScore: 92,
      avgResolutionTime: 5,
      trendDirection: 'up'
    },
  },
  // Predictive Analysis (AI Widget)
  {
    queryKey: ['predictive-analysis'],
    data: {
      nextMonthNCs: 14,
      riskLevel: 'medium',
      patterns: [
        { type: 'Sazonalidade', confidence: 85, description: 'Aumento histórico de NCs de processo nos meses de verão devido a temperatura.' },
        { type: 'Correlação', confidence: 78, description: 'Forte relação entre atrasos de calibração e aumento de sucata no setor B.' },
        { type: 'Tendência', confidence: 92, description: 'Redução consistente de anomalias críticas no último trimestre.' }
      ],
      recommendations: [
        { title: 'Antecipar calibrações', description: 'Revisar equipamentos do setor B antes do pico de verão.', impact: 'Alto', effort: 'Médio', priority: 'high' },
        { title: 'Reforço de treinamento', description: 'Reciclagem em procedimentos de controle de temperatura.', impact: 'Médio', effort: 'Baixo', priority: 'medium' }
      ]
    },
  },
  // Quality Trends (AI Widget Chart)
  {
    queryKey: ['quality-trends'],
    data: [
      { date: '2026-01-01', compliance: 85, incidents: 12 },
      { date: '2026-01-08', compliance: 87, incidents: 10 },
      { date: '2026-01-15', compliance: 86, incidents: 11 },
      { date: '2026-01-22', compliance: 89, incidents: 8 },
      { date: '2026-01-29', compliance: 91, incidents: 6 },
      { date: '2026-02-05', compliance: 90, incidents: 7 },
      { date: '2026-02-12', compliance: 92, incidents: 5 }
    ],
  },
];
