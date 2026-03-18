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
      { id: '1', nc_number: 'NC-2026-001', title: 'Desvio de temperatura na câmara fria', category: 'Processo', severity: 'Maior', status: 'Em Tratamento', current_stage: 3, due_date: '2026-03-01', completion_date: null, created_at: '2026-01-05T08:30:00Z' },
      { id: '2', nc_number: 'NC-2026-002', title: 'Documento desatualizado', category: 'Documentação', severity: 'Menor', status: 'Aberta', current_stage: 1, due_date: '2026-03-20', completion_date: null, created_at: '2026-01-12T11:00:00Z' },
      { id: '3', nc_number: 'NC-2026-003', title: 'Falha na calibração', category: 'Equipamento', severity: 'Crítica', status: 'Em Análise', current_stage: 2, due_date: '2026-02-20', completion_date: null, created_at: '2026-01-20T14:10:00Z' },
      { id: '4', nc_number: 'NC-2026-004', title: 'EPI fora do prazo de validade', category: 'SST', severity: 'Maior', status: 'Em Tratamento', current_stage: 4, due_date: '2026-03-10', completion_date: null, created_at: '2026-01-25T10:00:00Z' },
      { id: '5', nc_number: 'NC-2025-018', title: 'Resíduo descartado incorretamente', category: 'Ambiental', severity: 'Menor', status: 'Fechada', current_stage: 6, due_date: '2026-01-15', completion_date: '2026-01-14T16:00:00Z', created_at: '2025-12-10T09:00:00Z' },
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
      { id: 'pm-1', name: 'Mapa de Processo - Produção', description: 'Fluxo completo do processo produtivo', status: 'Ativo', version: '2.1', owner: 'Lucas Mendes', created_at: '2025-11-20T10:00:00Z', last_review: '2026-01-15' },
      { id: 'pm-2', name: 'Mapa de Processo - Qualidade', description: 'Fluxo de inspeção e controle de qualidade', status: 'Ativo', version: '3.0', owner: 'Pedro Almeida', created_at: '2025-08-10T09:30:00Z', last_review: '2025-12-01' },
      { id: 'pm-3', name: 'Mapa de Processo - Logística', description: 'Fluxo de recebimento e expedição', status: 'Em Revisão', version: '1.5', owner: 'Ana Silva', created_at: '2025-06-05T14:15:00Z', last_review: '2025-10-01' },
    ],
  },
  // Strategic maps
  {
    queryKey: ['strategic-maps'],
    data: [
      { id: 'sm-1', name: 'Mapa Estratégico 2025-2027', description: 'Plano estratégico principal com foco em crescimento e expansão.', created_at: '2025-01-01T10:00:00Z', perspectives: ['Financeira', 'Clientes', 'Processos', 'Aprendizado'], objectives_count: 16, status: 'Ativo' },
      { id: 'sm-2', name: 'BSC - Sustentabilidade', description: 'Metas e objetivos focados em ESG e práticas sustentáveis.', created_at: '2025-02-15T08:30:00Z', perspectives: ['Ambiental', 'Social', 'Governança'], objectives_count: 12, status: 'Ativo' },
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

  // ──────────────────────────────────────────────────────────
  // SGQ Documents module
  // ──────────────────────────────────────────────────────────

  // Responsáveis disponíveis para seleção
  {
    queryKey: ['sgq-documents', 'responsibles'],
    data: [
      { id: 'emp-1', full_name: 'Ana Silva' },
      { id: 'emp-6', full_name: 'Pedro Almeida' },
      { id: 'demo-user-002', full_name: 'Mariana Lopes' },
      { id: 'emp-8', full_name: 'Lucas Mendes' },
    ],
  },

  // Elaboradores disponíveis para seleção (apenas colaboradores)
  {
    queryKey: ['sgq-documents', 'elaborated-by-users'],
    data: [
      { id: 'emp-1', full_name: 'Ana Silva' },
      { id: 'emp-6', full_name: 'Pedro Almeida' },
      { id: 'emp-8', full_name: 'Lucas Mendes' },
    ],
  },

  // Departamentos disponíveis no formulário SGQ
  {
    queryKey: ['sgq-documents', 'departments'],
    data: [
      { id: 'dept-7', name: 'Qualidade' },
      { id: 'dept-2', name: 'Operações' },
      { id: 'dept-9', name: 'Produção' },
      { id: 'dept-4', name: 'Recursos Humanos' },
    ],
  },

  // Lista de documentos SGQ (prefixo — cobre qualquer combinação de filtros)
  {
    queryKey: ['sgq-documents'],
    data: [
      {
        id: 'sgq-doc-1',
        title: 'MQ-001 Manual da Qualidade',
        document_identifier_type: 'MQ',
        document_identifier_other: null,
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        branch_ids: ['branch-1'],
        branch_names: ['Unidade Industrial SP'],
        elaborated_by_user_id: 'emp-6',
        elaborated_by_name: 'Pedro Almeida',
        approved_by_user_id: 'emp-1',
        approved_by_name: 'Ana Silva',
        expiration_date: '2026-12-01',
        days_remaining: 266,
        status: 'Vigente',
        current_version_number: '6.0',
        pending_recipients: 0,
        pending_reviews: 0,
        norm_reference: 'ISO 9001:2015',
        responsible_department: 'Qualidade',
        notes: 'Manual atualizado conforme ISO 9001:2015 revisão 2025.',
        is_approved: true,
      },
      {
        id: 'sgq-doc-2',
        title: 'PO-003 Controle de Registros',
        document_identifier_type: 'PO',
        document_identifier_other: null,
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        branch_ids: ['branch-1'],
        branch_names: ['Unidade Industrial SP'],
        elaborated_by_user_id: 'emp-6',
        elaborated_by_name: 'Pedro Almeida',
        approved_by_user_id: 'demo-user-002',
        approved_by_name: 'Mariana Lopes',
        expiration_date: '2026-04-15',
        days_remaining: 36,
        status: 'A Vencer',
        current_version_number: '4.1',
        pending_recipients: 3,
        pending_reviews: 1,
        norm_reference: null,
        responsible_department: 'Qualidade',
        notes: 'Revisão programada para março de 2026.',
        is_approved: true,
      },
      {
        id: 'sgq-doc-3',
        title: 'IT-015 Inspeção de Recebimento',
        document_identifier_type: 'IT',
        document_identifier_other: null,
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        branch_ids: ['branch-1'],
        branch_names: ['Unidade Industrial SP'],
        elaborated_by_user_id: 'emp-8',
        elaborated_by_name: 'Lucas Mendes',
        approved_by_user_id: 'emp-6',
        approved_by_name: 'Pedro Almeida',
        expiration_date: '2026-02-01',
        days_remaining: -37,
        status: 'Vencido',
        current_version_number: '2.3',
        pending_recipients: 5,
        pending_reviews: 2,
        norm_reference: null,
        responsible_department: 'Produção',
        notes: 'Instrução vencida — aguardando revisão e aprovação.',
        is_approved: true,
      },
      {
        id: 'sgq-doc-4',
        title: 'PO-007 Auditoria Interna',
        document_identifier_type: 'PO',
        document_identifier_other: null,
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        branch_ids: ['branch-1'],
        branch_names: ['Unidade Industrial SP'],
        elaborated_by_user_id: 'demo-user-002',
        elaborated_by_name: 'Mariana Lopes',
        approved_by_user_id: 'emp-1',
        approved_by_name: 'Ana Silva',
        expiration_date: '2027-01-10',
        days_remaining: 306,
        status: 'Vigente',
        current_version_number: '3.2',
        pending_recipients: 0,
        pending_reviews: 0,
        norm_reference: 'ISO 9001:2015, ISO 19011:2018',
        responsible_department: 'Qualidade',
        notes: 'Procedimento alinhado ao programa de auditorias internas anuais.',
        is_approved: true,
      },
    ],
  },

  // Documentos do sistema disponíveis para referência no formulário
  {
    queryKey: ['sgq-documents', 'system-docs'],
    data: [
      { id: 'sys-doc-1', file_name: 'ISO 9001:2015 - Requisitos.pdf' },
      { id: 'sys-doc-2', file_name: 'ISO 14001:2015 - SGA.pdf' },
      { id: 'sys-doc-3', file_name: 'ISO 45001:2018 - SST.pdf' },
    ],
  },

  // Histórico de versões (prefixo — cobre qualquer documento selecionado)
  {
    queryKey: ['sgq-documents', 'versions'],
    data: [
      {
        id: 'sgq-ver-1',
        version_number: '6.0',
        changes_summary: 'Revisão completa para adequação às alterações da ISO 9001:2015 — edição 2024.',
        elaborated_by_name: 'Pedro Almeida',
        approved_by_name: 'Ana Silva',
        created_at: '2025-11-15T09:00:00Z',
        attachment_document_id: 'sys-doc-1',
        attachment_file_name: 'MQ-001_v6.0.pdf',
      },
      {
        id: 'sgq-ver-2',
        version_number: '5.1',
        changes_summary: 'Atualização do escopo do SGQ e inclusão de novos processos de suporte.',
        elaborated_by_name: 'Pedro Almeida',
        approved_by_name: 'Mariana Lopes',
        created_at: '2024-06-20T14:30:00Z',
        attachment_document_id: null,
        attachment_file_name: 'MQ-001_v5.1.pdf',
      },
      {
        id: 'sgq-ver-3',
        version_number: '5.0',
        changes_summary: 'Primeira versão aprovada pós-certificação ISO 9001 — revisão estrutural.',
        elaborated_by_name: 'Ana Silva',
        approved_by_name: 'Ana Silva',
        created_at: '2023-03-10T11:00:00Z',
        attachment_document_id: null,
        attachment_file_name: 'MQ-001_v5.0.pdf',
      },
    ],
  },

  // Campanhas de leitura (prefixo — cobre qualquer documento selecionado)
  {
    queryKey: ['sgq-documents', 'campaigns'],
    data: [
      {
        id: 'sgq-camp-1',
        title: 'Ciência do MQ-001 v6.0 — Equipe de Qualidade',
        version_number: '6.0',
        created_at: '2025-11-20T08:00:00Z',
        recipients: [
          { id: 'sgq-recip-1', user_id: 'emp-6', user_name: 'Pedro Almeida', status: 'confirmed', sent_at: '2025-11-20T08:05:00Z', confirmed_at: '2025-11-21T09:30:00Z' },
          { id: 'sgq-recip-2', user_id: 'demo-user-002', user_name: 'Mariana Lopes', status: 'confirmed', sent_at: '2025-11-20T08:05:00Z', confirmed_at: '2025-11-22T10:00:00Z' },
          { id: 'sgq-recip-3', user_id: 'emp-8', user_name: 'Lucas Mendes', status: 'pending', sent_at: '2025-11-20T08:05:00Z', confirmed_at: null },
          { id: 'sgq-recip-4', user_id: 'emp-1', user_name: 'Ana Silva', status: 'confirmed', sent_at: '2025-11-20T08:05:00Z', confirmed_at: '2025-11-20T15:45:00Z' },
        ],
      },
      {
        id: 'sgq-camp-2',
        title: 'Ciência do PO-003 v4.1 — Equipe Administrativa',
        version_number: '4.1',
        created_at: '2026-01-08T09:00:00Z',
        recipients: [
          { id: 'sgq-recip-5', user_id: 'emp-1', user_name: 'Ana Silva', status: 'confirmed', sent_at: '2026-01-08T09:05:00Z', confirmed_at: '2026-01-09T08:20:00Z' },
          { id: 'sgq-recip-6', user_id: 'emp-6', user_name: 'Pedro Almeida', status: 'sent', sent_at: '2026-01-08T09:05:00Z', confirmed_at: null },
          { id: 'sgq-recip-7', user_id: 'emp-8', user_name: 'Lucas Mendes', status: 'expired', sent_at: '2026-01-08T09:05:00Z', confirmed_at: null },
        ],
      },
    ],
  },

  // Solicitações de revisão pendentes (prefixo — cobre qualquer documento selecionado)
  {
    queryKey: ['sgq-documents', 'reviews'],
    data: [
      {
        id: 'sgq-rev-1',
        document_title: 'IT-015 Inspeção de Recebimento',
        requested_by_name: 'Lucas Mendes',
        reviewer_name: 'Pedro Almeida',
        status: 'pending',
        changes_summary: 'Inclusão de critérios de inspeção para novos fornecedores homologados em 2025.',
        attachment_document_id: 'sys-doc-1',
        attachment_file_name: 'IT-015_v2.4_proposta.pdf',
        reviewer_notes: null,
        created_at: '2026-02-10T10:30:00Z',
      },
      {
        id: 'sgq-rev-2',
        document_title: 'PO-003 Controle de Registros',
        requested_by_name: 'Mariana Lopes',
        reviewer_name: 'Ana Silva',
        status: 'approved',
        changes_summary: 'Atualização dos prazos de retenção de registros conforme LGPD e ISO 9001 cláusula 7.5.',
        attachment_document_id: null,
        attachment_file_name: 'PO-003_v4.2_proposta.pdf',
        reviewer_notes: 'Alterações adequadas e alinhadas com os requisitos normativos. Aprovado para publicação.',
        created_at: '2026-01-25T14:00:00Z',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Process Mapping module
  // ──────────────────────────────────────────────────────────

  // Detalhe de um mapa de processo (prefixo — cobre qualquer ID de mapa)
  {
    queryKey: ['processMap'],
    data: {
      id: 'pm-demo-1',
      name: 'Gestão de Resíduos Sólidos',
      description: 'Processo de coleta, triagem, armazenamento temporário e destinação final de resíduos sólidos industriais conforme PGRSS e legislação vigente.',
      process_type: 'Operacional',
      status: 'Ativo',
      version: '2.0',
      canvas_data: null,
      created_at: '2025-09-01T08:00:00Z',
      approved_at: '2025-09-15T10:00:00Z',
      is_current_version: true,
    },
  },

  // Elementos SIPOC do mapa de processo (prefixo)
  {
    queryKey: ['sipocElements'],
    data: [
      {
        id: 'sipoc-1',
        process_map_id: 'pm-demo-1',
        element_type: 'supplier',
        name: 'Setor de Produção',
        description: 'Principal gerador de resíduos sólidos industriais (embalagens, rejeitos, sucata).',
        order_index: 1,
      },
      {
        id: 'sipoc-2',
        process_map_id: 'pm-demo-1',
        element_type: 'supplier',
        name: 'Setor de Manutenção',
        description: 'Gerador de resíduos de lubrificantes, peças desgastadas e embalagens de produtos químicos.',
        order_index: 2,
      },
      {
        id: 'sipoc-3',
        process_map_id: 'pm-demo-1',
        element_type: 'input',
        name: 'Resíduos Classe I (Perigosos)',
        description: 'Óleos lubrificantes, solventes e embalagens contaminadas gerados nos processos produtivos.',
        order_index: 1,
      },
      {
        id: 'sipoc-4',
        process_map_id: 'pm-demo-1',
        element_type: 'input',
        name: 'Resíduos Classe II (Não Perigosos)',
        description: 'Papelão, plástico, metal e rejeitos orgânicos provenientes das operações.',
        order_index: 2,
      },
      {
        id: 'sipoc-5',
        process_map_id: 'pm-demo-1',
        element_type: 'process',
        name: 'Triagem e Segregação',
        description: 'Classificação dos resíduos por tipo, periculosidade e destinação, conforme PGRSS.',
        order_index: 1,
      },
      {
        id: 'sipoc-6',
        process_map_id: 'pm-demo-1',
        element_type: 'process',
        name: 'Armazenamento Temporário',
        description: 'Acondicionamento em área licenciada com identificação, sinalização e controle de acesso.',
        order_index: 2,
      },
      {
        id: 'sipoc-7',
        process_map_id: 'pm-demo-1',
        element_type: 'process',
        name: 'Destinação Final',
        description: 'Coleta por transportador licenciado e envio a aterro, reciclador ou coprocessador certificado.',
        order_index: 3,
      },
      {
        id: 'sipoc-8',
        process_map_id: 'pm-demo-1',
        element_type: 'output',
        name: 'MTR emitido (Manifesto de Transporte)',
        description: 'Documento comprobatório da destinação ambientalmente adequada dos resíduos.',
        order_index: 1,
      },
      {
        id: 'sipoc-9',
        process_map_id: 'pm-demo-1',
        element_type: 'output',
        name: 'Relatório de Inventário de Resíduos',
        description: 'Registro mensal de quantidades geradas por tipo de resíduo para fins de PGRS e RIMA.',
        order_index: 2,
      },
      {
        id: 'sipoc-10',
        process_map_id: 'pm-demo-1',
        element_type: 'customer',
        name: 'Órgão Ambiental (CETESB / IBAMA)',
        description: 'Recebe declarações e inventários obrigatórios de resíduos industriais.',
        order_index: 1,
      },
      {
        id: 'sipoc-11',
        process_map_id: 'pm-demo-1',
        element_type: 'customer',
        name: 'Empresa Transportadora Licenciada',
        description: 'Responsável pela coleta e transporte dos resíduos até a destinação final.',
        order_index: 2,
      },
    ],
  },

  // Diagrama de Tartaruga do mapa de processo (prefixo)
  {
    queryKey: ['turtleDiagram'],
    data: {
      id: 'turtle-demo-1',
      process_map_id: 'pm-demo-1',
      inputs: [
        'Resíduos Classe I (Perigosos) — óleos, solventes, embalagens contaminadas',
        'Resíduos Classe II (Não Perigosos) — papelão, plástico, metal, rejeitos orgânicos',
        'Manifestos de Transporte (MTR) e formulários de controle interno',
      ],
      outputs: [
        'Resíduos segregados e destinados conforme legislação ambiental vigente',
        'MTR emitido e arquivado com comprovante de destinação adequada',
        'Relatório mensal de inventário de resíduos para PGRS e auditorias',
      ],
      resources: [
        'Área de armazenamento temporário licenciada com sinalização e cobertura',
        'Equipe treinada em NR-20, NR-25 e procedimentos do PGRSS',
        'Transportador e destinador finais licenciados pelo órgão ambiental competente',
      ],
      methods: [
        'PGRSS — Plano de Gerenciamento de Resíduos de Serviços e Sólidos Industriais',
        'IT-022 Instrução de Triagem e Identificação de Resíduos',
        'PO-009 Procedimento de Coleta e Destinação de Resíduos Classe I',
      ],
      measurements: [
        'Volume mensal de resíduos gerados por categoria (kg/mês)',
        'Taxa de reciclagem sobre o total de resíduos Classe II gerados (%)',
        'Número de não-conformidades ambientais relacionadas a resíduos no período',
      ],
      risks: [
        'Contaminação de solo e lençol freático por armazenamento inadequado de resíduos perigosos',
        'Autuação por órgão ambiental devido a destinação sem MTR ou transportador não licenciado',
        'Acidente com colaborador por falta de EPI ou sinalização inadequada na área de resíduos',
      ],
    },
  },

  // ── Regulatory Documents ──────────────────────────────────────────

  // Settings
  {
    queryKey: ['regulatory-documents', 'settings'],
    data: { default_expiring_days: 30 },
  },
  {
    queryKey: ['sgq-documents', 'settings'],
    data: { default_expiring_days: 30 },
  },

  // Responsible users for regulatory docs
  {
    queryKey: ['regulatory-documents', 'responsibles'],
    data: [
      { id: 'emp-1', full_name: 'Ana Silva' },
      { id: 'emp-2', full_name: 'Carlos Santos' },
      { id: 'emp-6', full_name: 'Pedro Almeida' },
      { id: 'demo-user-002', full_name: 'Mariana Lopes' },
    ],
  },

  // Regulatory document list (prefix match for any filter combo)
  {
    queryKey: ['regulatory-documents'],
    data: [
      {
        id: 'reg-doc-1',
        document_identifier_type: 'Licença de Operação',
        document_identifier_other: null,
        document_number: 'LO-2024-0001',
        issuing_body: 'CETESB',
        process_number: 'PROC-2024-00123',
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        responsible_user_id: 'emp-2',
        responsible_name: 'Carlos Santos',
        issue_date: '2024-03-15',
        expiration_date: '2027-03-14',
        days_remaining: 370,
        status: 'Vigente' as const,
        renewal_required: true,
        renewal_alert_days: 90,
        renewal_status: 'nao_iniciado' as const,
        renewal_start_date: null,
        renewal_protocol_number: null,
        renewed_expiration_date: null,
        notes: 'Licença de operação principal da unidade industrial.',
        current_version_number: 2,
        attachment_document_id: null,
        external_source_provider: null,
        external_source_reference: null,
        external_source_url: null,
        created_at: '2024-03-15T10:00:00Z',
      },
      {
        id: 'reg-doc-2',
        document_identifier_type: 'Outorga',
        document_identifier_other: null,
        document_number: 'OUT-2023-0045',
        issuing_body: 'DAEE',
        process_number: 'PROC-2023-00456',
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        responsible_user_id: 'emp-2',
        responsible_name: 'Carlos Santos',
        issue_date: '2023-06-01',
        expiration_date: '2026-06-01',
        days_remaining: 83,
        status: 'A Vencer' as const,
        renewal_required: true,
        renewal_alert_days: 90,
        renewal_status: 'em_andamento' as const,
        renewal_start_date: '2026-02-01',
        renewal_protocol_number: 'PROT-2026-0012',
        renewed_expiration_date: null,
        notes: 'Outorga de captação de água subterrânea — poço artesiano.',
        current_version_number: 1,
        attachment_document_id: null,
        external_source_provider: null,
        external_source_reference: null,
        external_source_url: null,
        created_at: '2023-06-01T09:00:00Z',
      },
      {
        id: 'reg-doc-3',
        document_identifier_type: 'CADRI',
        document_identifier_other: null,
        document_number: 'CADRI-2025-0078',
        issuing_body: 'CETESB',
        process_number: 'PROC-2025-00789',
        branch_id: 'branch-1',
        branch_name: 'Unidade Industrial SP',
        responsible_user_id: 'emp-1',
        responsible_name: 'Ana Silva',
        issue_date: '2025-01-10',
        expiration_date: '2026-01-09',
        days_remaining: -60,
        status: 'Vencido' as const,
        renewal_required: true,
        renewal_alert_days: 60,
        renewal_status: 'protocolado' as const,
        renewal_start_date: '2025-11-15',
        renewal_protocol_number: 'PROT-2025-0089',
        renewed_expiration_date: null,
        notes: 'CADRI para destinação de resíduos Classe I — aguardando novo certificado.',
        current_version_number: 1,
        attachment_document_id: null,
        external_source_provider: null,
        external_source_reference: null,
        external_source_url: null,
        created_at: '2025-01-10T11:00:00Z',
      },
    ],
  },

  // Regulatory document versions (prefix match)
  {
    queryKey: ['regulatory-documents', 'versions'],
    data: [
      { id: 'reg-v-1', version_number: 1, changes_summary: 'Emissão original da LO', elaborated_by_name: 'Carlos Santos', approved_by_name: 'Ana Silva', created_at: '2024-03-15T10:00:00Z', attachment_document_id: null, attachment_file_name: null },
      { id: 'reg-v-2', version_number: 2, changes_summary: 'Renovação com atualização de condicionantes', elaborated_by_name: 'Carlos Santos', approved_by_name: 'Ana Silva', created_at: '2025-03-10T14:00:00Z', attachment_document_id: 'doc-att-1', attachment_file_name: 'LO-2024-0001-v2.pdf' },
    ],
  },

  // ── Training participants (modal, prefix match) ───────────────────

  {
    queryKey: ['training-participants-modal'],
    data: [
      { id: 'emp-1', full_name: 'Ana Silva', department: 'Operações', position: 'Gerente de Operações', email: 'ana.silva@demo.com' },
      { id: 'emp-4', full_name: 'Roberto Oliveira', department: 'SST', position: 'Técnico de Segurança', email: 'roberto.oliveira@demo.com' },
      { id: 'emp-6', full_name: 'Pedro Almeida', department: 'Qualidade', position: 'Engenheiro de Qualidade', email: 'pedro.almeida@demo.com' },
      { id: 'emp-8', full_name: 'Lucas Mendes', department: 'Produção', position: 'Supervisor de Produção', email: 'lucas.mendes@demo.com' },
    ],
  },

  // ── Audit Trail (admin, prefix match) ─────────────────────────────

  {
    queryKey: ['audit-trail'],
    data: [
      { id: 'at-1', action: 'create', entity_type: 'non_conformity', entity_id: '1', description: 'NC-2026-001 criada', user_name: 'Lucas Mendes', created_at: '2026-01-05T08:30:00Z' },
      { id: 'at-2', action: 'update', entity_type: 'document', entity_id: 'sgq-doc-1', description: 'MQ-001 atualizado para v6.0', user_name: 'Pedro Almeida', created_at: '2026-01-20T14:00:00Z' },
      { id: 'at-3', action: 'approve', entity_type: 'corrective_action', entity_id: 'ca-1', description: 'Ação corretiva aprovada', user_name: 'Ana Silva', created_at: '2026-02-01T10:15:00Z' },
      { id: 'at-4', action: 'create', entity_type: 'audit', entity_id: 'aud-1', description: 'Auditoria interna ISO 9001 agendada', user_name: 'Mariana Lopes', created_at: '2026-02-10T09:00:00Z' },
      { id: 'at-5', action: 'complete', entity_type: 'training', entity_id: 'tp-1', description: 'NR-12 concluído — 8 participantes', user_name: 'Roberto Oliveira', created_at: '2026-02-15T16:30:00Z' },
    ],
  },
];
