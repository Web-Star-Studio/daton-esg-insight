/**
 * Mock data for Financial modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 2; // February

// ─── DashboardFinanceiro query shapes ────────────────────────────────────────

const MOCK_BUDGET_SUMMARY = {
  totalBudget: 12000000,
  totalSpent: 8200000,
  executionRate: 68.3,
  criticalCategories: [
    { category: 'Matéria-Prima', percentage: 87.4 },
    { category: 'Logística', percentage: 82.1 },
  ],
};

const MOCK_CASHFLOW_SUMMARY = {
  monthlyInflows: 1150000,
  monthlyOutflows: 900000,
  netCashFlow: 250000,
  projectedBalance: 3450000,
  overduePayables: 60320,
  overdueReceivables: 106700,
};

// Shape must match DREData interface in src/components/financial/DRETable.tsx
// Also includes margemBruta and margemLiquida used directly by DashboardFinanceiro.tsx
const MOCK_DRE = {
  receitaBruta: 1150000,
  deducoes: 57500,
  receitaLiquida: 1092500,
  custos: 402500,
  lucroBruto: 690000,
  despesasOperacionais: 385000,
  ebitda: 305000,
  depreciacaoAmortizacao: 48000,
  ebit: 257000,
  resultadoFinanceiro: 15500,
  lair: 272500,
  impostos: 31000,
  lucroLiquido: 241500,
  margemBruta: 63.2,
  margemLiquida: 22.1,
};

const MOCK_FINANCIAL_INDICATORS = {
  margemBruta: 63.2,
  margemEbitda: 27.9,
  margemLiquida: 22.1,
  liquidezCorrente: 1.85,
};

const MOCK_MONTHLY_COMPARISON = [
  { month: 'Set/25', receitas: 1050000, despesas: 820000, lucro: 230000 },
  { month: 'Out/25', receitas: 1100000, despesas: 890000, lucro: 210000 },
  { month: 'Nov/25', receitas: 980000,  despesas: 850000, lucro: 130000 },
  { month: 'Dez/25', receitas: 1300000, despesas: 1050000, lucro: 250000 },
  { month: 'Jan/26', receitas: 1200000, despesas: 950000,  lucro: 250000 },
  { month: 'Fev/26', receitas: 1150000, despesas: 900000,  lucro: 250000 },
];

const MOCK_FINANCIAL_ALERTS = [
  {
    id: 'overdue-NF-44501',
    type: 'overdue' as const,
    severity: 'high' as const,
    title: 'Conta em atraso - Logística Verde Ltda',
    description: 'Vencimento: 12/01/2026',
    amount: 18250,
    actionUrl: '/demo/financeiro/contas-pagar',
  },
  {
    id: 'due-soon-NF-45679',
    type: 'due_soon' as const,
    severity: 'medium' as const,
    title: 'Vence em breve - EcoTransp Ltda',
    description: 'Vencimento: 20/02/2026',
    amount: 8500,
    actionUrl: '/demo/financeiro/contas-pagar',
  },
];

const DEMO_OVERDUE_PAYABLES = [
  {
    id: 'op-1',
    invoice_number: 'NF-44501',
    supplier_name: 'Logística Verde Ltda',
    category: 'Transporte',
    original_amount: 18250,
    final_amount: 18250,
    due_date: '2026-01-12',
    status: 'Vencido',
    approval_status: 'Aprovado',
    company_id: DEMO_COMPANY_ID,
  },
  {
    id: 'op-2',
    invoice_number: 'NF-44532',
    supplier_name: 'Energia Elétrica SP',
    category: 'Utilidades',
    original_amount: 32400,
    final_amount: 32400,
    due_date: '2026-01-18',
    status: 'Vencido',
    approval_status: 'Pendente',
    company_id: DEMO_COMPANY_ID,
  },
  {
    id: 'op-3',
    invoice_number: 'NF-44610',
    supplier_name: 'Eco Tratamento de Resíduos',
    category: 'Resíduos',
    original_amount: 9670,
    final_amount: 9670,
    due_date: '2026-02-03',
    status: 'Vencido',
    approval_status: 'Pendente',
    company_id: DEMO_COMPANY_ID,
  },
];

const DEMO_OVERDUE_RECEIVABLES = [
  {
    id: 'or-1',
    invoice_number: 'NF-S-2025-155',
    customer_name: 'Construtora Delta',
    category: 'Serviços',
    original_amount: 45200,
    final_amount: 45200,
    due_date: '2026-01-20',
    status: 'Vencido',
    company_id: DEMO_COMPANY_ID,
  },
  {
    id: 'or-2',
    invoice_number: 'NF-S-2025-163',
    customer_name: 'Indústria Norte',
    category: 'Vendas',
    original_amount: 61500,
    final_amount: 61500,
    due_date: '2026-01-27',
    status: 'Vencido',
    company_id: DEMO_COMPANY_ID,
  },
];

const DEMO_APPROVAL_REQUESTS = [
  {
    id: 'apr-1',
    company_id: DEMO_COMPANY_ID,
    workflow_id: 'aw-fin-1',
    entity_type: 'accounts_payable',
    entity_id: 'op-2',
    requested_by_user_id: 'demo-user-003',
    current_step: 1,
    status: 'Pendente',
    created_at: '2026-02-17T13:10:00Z',
    updated_at: '2026-02-17T13:10:00Z',
  },
  {
    id: 'apr-2',
    company_id: DEMO_COMPANY_ID,
    workflow_id: 'aw-fin-1',
    entity_type: 'accounting_entry',
    entity_id: 'ae-3',
    requested_by_user_id: 'demo-user-002',
    current_step: 2,
    status: 'Em Análise',
    created_at: '2026-02-16T09:35:00Z',
    updated_at: '2026-02-18T08:20:00Z',
  },
  {
    id: 'apr-3',
    company_id: DEMO_COMPANY_ID,
    workflow_id: 'aw-fin-2',
    entity_type: 'accounts_receivable',
    entity_id: 'or-1',
    requested_by_user_id: 'demo-user-001',
    current_step: 1,
    status: 'Pendente',
    created_at: '2026-02-15T16:45:00Z',
    updated_at: '2026-02-15T16:45:00Z',
  },
];

export const financialMockEntries = [
  // ── DashboardFinanceiro queries ──────────────────────────────────────────
  { queryKey: ['budget-summary'] as const,                             data: MOCK_BUDGET_SUMMARY },
  { queryKey: ['budget-summary', CURRENT_YEAR] as const,               data: MOCK_BUDGET_SUMMARY },

  { queryKey: ['cashflow-summary'] as const,                           data: MOCK_CASHFLOW_SUMMARY },
  { queryKey: ['cashflow-summary', CURRENT_YEAR] as const,             data: MOCK_CASHFLOW_SUMMARY },
  { queryKey: ['cashflow-summary', CURRENT_MONTH, CURRENT_YEAR] as const, data: MOCK_CASHFLOW_SUMMARY },

  { queryKey: ['dre'] as const,                                        data: MOCK_DRE },
  { queryKey: ['dre', CURRENT_YEAR] as const,                          data: MOCK_DRE },
  { queryKey: ['dre', CURRENT_YEAR, CURRENT_MONTH] as const,           data: MOCK_DRE },
  { queryKey: ['dre', CURRENT_YEAR - 1] as const,                      data: MOCK_DRE },
  { queryKey: ['dre', CURRENT_YEAR - 2] as const,                      data: MOCK_DRE },

  { queryKey: ['financial-indicators'] as const,                       data: MOCK_FINANCIAL_INDICATORS },
  { queryKey: ['financial-indicators', CURRENT_YEAR] as const,         data: MOCK_FINANCIAL_INDICATORS },
  { queryKey: ['financial-indicators', CURRENT_YEAR - 1] as const,     data: MOCK_FINANCIAL_INDICATORS },

  { queryKey: ['monthly-comparison'] as const,                         data: MOCK_MONTHLY_COMPARISON },
  { queryKey: ['monthly-comparison', CURRENT_YEAR] as const,           data: MOCK_MONTHLY_COMPARISON },

  { queryKey: ['financial-alerts'] as const,                           data: MOCK_FINANCIAL_ALERTS },

  // Financial dashboard
  {
    queryKey: ['financial-dashboard', DEMO_COMPANY_ID],
    data: {
      totalRevenue: 12500000,
      totalExpenses: 9800000,
      netProfit: 2700000,
      profitMargin: 21.6,
      cashBalance: 3200000,
      accountsPayable: 1450000,
      accountsReceivable: 2100000,
      esgInvestment: 850000,
      revenueChange: 8.5,
      expenseChange: 5.2,
    },
  },
  // Financial dashboard (base)
  {
    queryKey: ['financial-dashboard'],
    data: {
      totalRevenue: 12500000,
      totalExpenses: 9800000,
      netProfit: 2700000,
      profitMargin: 21.6,
      cashBalance: 3200000,
      accountsPayable: 1450000,
      accountsReceivable: 2100000,
      esgInvestment: 850000,
    },
  },
  // Chart of accounts
  {
    queryKey: ['chart-of-accounts', DEMO_COMPANY_ID],
    data: [
      { id: 'coa-1', code: '1', name: 'ATIVO', type: 'Ativo', level: 1, parent_id: null, is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-2', code: '1.1', name: 'Ativo Circulante', type: 'Ativo', level: 2, parent_id: 'coa-1', is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-3', code: '1.1.1', name: 'Caixa e Equivalentes', type: 'Ativo', level: 3, parent_id: 'coa-2', is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-4', code: '1.1.2', name: 'Contas a Receber', type: 'Ativo', level: 3, parent_id: 'coa-2', is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-5', code: '2', name: 'PASSIVO', type: 'Passivo', level: 1, parent_id: null, is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-6', code: '2.1', name: 'Passivo Circulante', type: 'Passivo', level: 2, parent_id: 'coa-5', is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-7', code: '3', name: 'RECEITAS', type: 'Receita', level: 1, parent_id: null, is_active: true, company_id: DEMO_COMPANY_ID },
      { id: 'coa-8', code: '4', name: 'DESPESAS', type: 'Despesa', level: 1, parent_id: null, is_active: true, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Chart of accounts (base)
  {
    queryKey: ['chart-of-accounts'],
    data: [
      { id: 'coa-1', code: '1', name: 'ATIVO', type: 'Ativo', level: 1 },
      { id: 'coa-5', code: '2', name: 'PASSIVO', type: 'Passivo', level: 1 },
      { id: 'coa-7', code: '3', name: 'RECEITAS', type: 'Receita', level: 1 },
      { id: 'coa-8', code: '4', name: 'DESPESAS', type: 'Despesa', level: 1 },
    ],
  },
  // Accounting entries
  {
    queryKey: ['accounting-entries', DEMO_COMPANY_ID],
    data: [
      { id: 'ae-1', entry_number: 'LC-2026-001', description: 'Pagamento fornecedor Aço Verde', entry_date: '2026-02-01', accounting_date: '2026-02-01', total_debit: 45000, total_credit: 45000, status: 'Aprovado', company_id: DEMO_COMPANY_ID },
      { id: 'ae-2', entry_number: 'LC-2026-002', description: 'Receita de vendas Janeiro', entry_date: '2026-01-31', accounting_date: '2026-01-31', total_debit: 1200000, total_credit: 1200000, status: 'Aprovado', company_id: DEMO_COMPANY_ID },
      { id: 'ae-3', entry_number: 'LC-2026-003', description: 'Folha de pagamento Jan/26', entry_date: '2026-02-05', accounting_date: '2026-02-05', total_debit: 580000, total_credit: 580000, status: 'Pendente', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Accounting entries (base)
  {
    queryKey: ['accounting-entries'],
    data: [
      { id: 'ae-1', entry_number: 'LC-2026-001', description: 'Pagamento fornecedor Aço Verde', total_debit: 45000, status: 'Aprovado' },
    ],
  },
  // Accounts payable
  {
    queryKey: ['accounts-payable', DEMO_COMPANY_ID],
    data: [
      { id: 'ap-1', invoice_number: 'NF-45678', supplier_name: 'Aço Verde S.A.', category: 'Matéria-Prima', original_amount: 45000, final_amount: 45000, due_date: '2026-02-15', status: 'Pendente', company_id: DEMO_COMPANY_ID },
      { id: 'ap-2', invoice_number: 'NF-45679', supplier_name: 'EcoTransp Ltda', category: 'Transporte', original_amount: 8500, final_amount: 8500, due_date: '2026-02-20', status: 'Pendente', company_id: DEMO_COMPANY_ID },
      { id: 'ap-3', invoice_number: 'NF-45650', supplier_name: 'Energia Elétrica SP', category: 'Utilidades', original_amount: 32000, final_amount: 32000, due_date: '2026-02-10', status: 'Pago', payment_date: '2026-02-08', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Accounts payable (base)
  {
    queryKey: ['accounts-payable'],
    data: [
      { id: 'ap-1', invoice_number: 'NF-45678', supplier_name: 'Aço Verde S.A.', original_amount: 45000, status: 'Pendente' },
    ],
  },
  // Overdue payables
  {
    queryKey: ['overdue-payables'],
    data: DEMO_OVERDUE_PAYABLES,
  },
  // Payables stats
  {
    queryKey: ['payables-stats'],
    data: {
      totalPayable: 1450000,
      overdue: 85000,
      dueSoon: 320000,
      paid: 980000,
      overdueCount: 3,
      pendingCount: 12,
    },
  },
  // Payable wastes
  {
    queryKey: ['payable-wastes'],
    data: [
      { id: 'pw-1', waste_type: 'Resíduos Classe I', amount: 15000, status: 'Pendente', due_date: '2026-02-28' },
      { id: 'pw-2', waste_type: 'Resíduos Classe IIA', amount: 8500, status: 'Pago', due_date: '2026-01-31' },
    ],
  },
  // Accounts receivable
  {
    queryKey: ['accounts-receivable', DEMO_COMPANY_ID],
    data: [
      { id: 'ar-1', invoice_number: 'NF-S-2026-001', customer_name: 'Indústria ABC Ltda', category: 'Vendas', original_amount: 120000, final_amount: 120000, due_date: '2026-02-28', status: 'A Receber', company_id: DEMO_COMPANY_ID },
      { id: 'ar-2', invoice_number: 'NF-S-2026-002', customer_name: 'Construtora XYZ', category: 'Serviços', original_amount: 85000, final_amount: 85000, due_date: '2026-03-15', status: 'A Receber', company_id: DEMO_COMPANY_ID },
      { id: 'ar-3', invoice_number: 'NF-S-2025-120', customer_name: 'Distribuidora Nacional', category: 'Vendas', original_amount: 200000, final_amount: 200000, due_date: '2026-01-30', status: 'Recebido', receipt_date: '2026-01-29', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Accounts receivable (base)
  {
    queryKey: ['accounts-receivable'],
    data: [
      { id: 'ar-1', invoice_number: 'NF-S-2026-001', customer_name: 'Indústria ABC Ltda', original_amount: 120000, status: 'A Receber' },
    ],
  },
  // Overdue receivables
  {
    queryKey: ['overdue-receivables'],
    data: DEMO_OVERDUE_RECEIVABLES,
  },
  // Cost centers
  {
    queryKey: ['cost-centers', DEMO_COMPANY_ID],
    data: [
      { id: 'cc-1', name: 'Produção', code: 'CC-001', budget: 5000000, spent: 3800000, company_id: DEMO_COMPANY_ID },
      { id: 'cc-2', name: 'Administrativo', code: 'CC-002', budget: 1500000, spent: 1200000, company_id: DEMO_COMPANY_ID },
      { id: 'cc-3', name: 'Comercial', code: 'CC-003', budget: 800000, spent: 650000, company_id: DEMO_COMPANY_ID },
      { id: 'cc-4', name: 'P&D', code: 'CC-004', budget: 600000, spent: 420000, company_id: DEMO_COMPANY_ID },
      { id: 'cc-5', name: 'Sustentabilidade', code: 'CC-005', budget: 850000, spent: 580000, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Cost centers (base)
  {
    queryKey: ['cost-centers'],
    data: [
      { id: 'cc-1', name: 'Produção', code: 'CC-001', budget: 5000000, spent: 3800000 },
      { id: 'cc-2', name: 'Administrativo', code: 'CC-002', budget: 1500000, spent: 1200000 },
      { id: 'cc-3', name: 'Comercial', code: 'CC-003', budget: 800000, spent: 650000 },
    ],
  },
  // Cash flow
  {
    queryKey: ['cash-flow', DEMO_COMPANY_ID],
    data: {
      monthly: [
        { month: 'Set/25', inflow: 1050000, outflow: 820000, balance: 230000 },
        { month: 'Out/25', inflow: 1100000, outflow: 890000, balance: 210000 },
        { month: 'Nov/25', inflow: 980000, outflow: 850000, balance: 130000 },
        { month: 'Dez/25', inflow: 1300000, outflow: 1050000, balance: 250000 },
        { month: 'Jan/26', inflow: 1200000, outflow: 950000, balance: 250000 },
        { month: 'Fev/26', inflow: 1150000, outflow: 900000, balance: 250000 },
      ],
      currentBalance: 3200000,
    },
  },
  // Cash flow (base)
  {
    queryKey: ['cash-flow'],
    data: {
      monthly: [
        { month: 'Jan/26', inflow: 1200000, outflow: 950000, balance: 250000 },
        { month: 'Fev/26', inflow: 1150000, outflow: 900000, balance: 250000 },
      ],
      currentBalance: 3200000,
    },
  },
  // Budget
  {
    queryKey: ['budget', DEMO_COMPANY_ID],
    data: {
      totalBudget: 12000000,
      totalSpent: 8200000,
      utilization: 68.3,
      byDepartment: [
        { name: 'Produção', budget: 5000000, spent: 3800000 },
        { name: 'Administrativo', budget: 1500000, spent: 1200000 },
        { name: 'Comercial', budget: 800000, spent: 650000 },
        { name: 'P&D', budget: 600000, spent: 420000 },
        { name: 'Sustentabilidade', budget: 850000, spent: 580000 },
      ],
    },
  },
  // Budget (base)
  {
    queryKey: ['budget'],
    data: {
      totalBudget: 12000000,
      totalSpent: 8200000,
      utilization: 68.3,
    },
  },
  // Financial approvals
  {
    queryKey: ['financial-approvals', DEMO_COMPANY_ID],
    data: [
      { id: 'fa-1', type: 'Conta a Pagar', description: 'NF-45680 - Manutenção Industrial', amount: 15000, requester: 'Ana Silva', status: 'Pendente', created_at: '2026-02-08' },
      { id: 'fa-2', type: 'Orçamento', description: 'Projeto de Energia Solar', amount: 180000, requester: 'Carlos Santos', status: 'Pendente', created_at: '2026-02-05' },
    ],
  },
  // Financial approvals (base)
  {
    queryKey: ['financial-approvals'],
    data: [
      { id: 'fa-1', type: 'Conta a Pagar', description: 'NF-45680 - Manutenção Industrial', amount: 15000, status: 'Pendente' },
    ],
  },
  // Pending approval requests
  {
    queryKey: ['approval-requests-pending'],
    data: DEMO_APPROVAL_REQUESTS,
  },
  // ESG Financial dashboard
  {
    queryKey: ['esg-financial', DEMO_COMPANY_ID],
    data: {
      environmental_costs: 350000,
      social_costs: 280000,
      governance_costs: 220000,
      total_esg_costs: 850000,
      esg_percentage: 8.7,
      carbon_impact: 1247.5,
    },
  },
  // ESG Financial (base)
  {
    queryKey: ['esg-financial'],
    data: {
      environmental_costs: 350000,
      social_costs: 280000,
      governance_costs: 220000,
      total_esg_costs: 850000,
    },
  },
  // Financial reports
  {
    queryKey: ['financial-reports', DEMO_COMPANY_ID],
    data: [
      { id: 'fr-1', title: 'Relatório Financeiro Jan/2026', type: 'Mensal', status: 'Publicado', period: '2026-01' },
      { id: 'fr-2', title: 'DRE Q4 2025', type: 'Trimestral', status: 'Publicado', period: '2025-Q4' },
    ],
  },
  // Financial reports (base)
  {
    queryKey: ['financial-reports'],
    data: [
      { id: 'fr-1', title: 'Relatório Financeiro Jan/2026', type: 'Mensal', status: 'Publicado' },
    ],
  },
  // Profitability
  {
    queryKey: ['profitability', DEMO_COMPANY_ID],
    data: {
      roi: 22.5,
      categories: [
        { name: 'Produto A', revenue: 5000000, cost: 3500000, margin: 30 },
        { name: 'Produto B', revenue: 4000000, cost: 3000000, margin: 25 },
        { name: 'Serviços', revenue: 3500000, cost: 2300000, margin: 34.3 },
      ],
    },
  },
  // Profitability (base)
  {
    queryKey: ['profitability'],
    data: {
      roi: 22.5,
      categories: [
        { name: 'Produto A', revenue: 5000000, cost: 3500000, margin: 30 },
      ],
    },
  },
  // Bank accounts
  {
    queryKey: ['bank-accounts'],
    data: [
      { id: 'ba-1', bank_name: 'Banco do Brasil', account_number: '12345-6', agency: '1234', balance: 1850000, type: 'Corrente' },
      { id: 'ba-2', bank_name: 'Itaú', account_number: '78901-2', agency: '5678', balance: 1350000, type: 'Corrente' },
    ],
  },
  // Projects
  {
    queryKey: ['projects'],
    data: [
      { id: 'proj-1', name: 'Energia Solar Unidade 2', budget: 180000, spent: 95000, status: 'Em Andamento' },
      { id: 'proj-2', name: 'Reflorestamento Norte', budget: 250000, spent: 120000, status: 'Em Andamento' },
    ],
  },
  // Project profitability — used by AnaliseRentabilidade.tsx
  {
    queryKey: ['project-profitability', CURRENT_YEAR],
    data: [
      { name: 'Projeto Solar ESG', orcado: 450000, realizado: 380000, economia: 70000, roi: 18.4, status: 'Em andamento' },
      { name: 'Certificação ISO 14001', orcado: 120000, realizado: 105000, economia: 15000, roi: 12.5, status: 'Concluído' },
      { name: 'Programa Zero Resíduos', orcado: 85000, realizado: 72000, economia: 13000, roi: 15.3, status: 'Em andamento' },
      { name: 'Treinamento ESG Colaboradores', orcado: 65000, realizado: 58000, economia: 7000, roi: 10.8, status: 'Concluído' },
    ],
  },
  {
    queryKey: ['project-profitability'],
    data: [],
  },
  // Category profitability — used by AnaliseRentabilidade.tsx
  {
    queryKey: ['category-profitability', CURRENT_YEAR],
    data: [
      { category: 'Ambiental', orcado: 800000, realizado: 640000, economia: 160000, eficiencia: 80.0 },
      { category: 'Social', orcado: 350000, realizado: 290000, economia: 60000, eficiencia: 82.9 },
      { category: 'Governança', orcado: 200000, realizado: 175000, economia: 25000, eficiencia: 87.5 },
      { category: 'Operacional', orcado: 5000000, realizado: 4250000, economia: 750000, eficiencia: 85.0 },
    ],
  },
  {
    queryKey: ['category-profitability'],
    data: [],
  },
];
