/**
 * Mock data for Quality (SGQ) modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

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
];
