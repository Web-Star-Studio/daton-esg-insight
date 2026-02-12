/**
 * Mock data for Financial modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const financialMockEntries = [
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
  // Accounting entries
  {
    queryKey: ['accounting-entries', DEMO_COMPANY_ID],
    data: [
      { id: 'ae-1', entry_number: 'LC-2026-001', description: 'Pagamento fornecedor Aço Verde', entry_date: '2026-02-01', accounting_date: '2026-02-01', total_debit: 45000, total_credit: 45000, status: 'Aprovado', company_id: DEMO_COMPANY_ID },
      { id: 'ae-2', entry_number: 'LC-2026-002', description: 'Receita de vendas Janeiro', entry_date: '2026-01-31', accounting_date: '2026-01-31', total_debit: 1200000, total_credit: 1200000, status: 'Aprovado', company_id: DEMO_COMPANY_ID },
      { id: 'ae-3', entry_number: 'LC-2026-003', description: 'Folha de pagamento Jan/26', entry_date: '2026-02-05', accounting_date: '2026-02-05', total_debit: 580000, total_credit: 580000, status: 'Pendente', company_id: DEMO_COMPANY_ID },
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
  // Accounts receivable
  {
    queryKey: ['accounts-receivable', DEMO_COMPANY_ID],
    data: [
      { id: 'ar-1', invoice_number: 'NF-S-2026-001', customer_name: 'Indústria ABC Ltda', category: 'Vendas', original_amount: 120000, final_amount: 120000, due_date: '2026-02-28', status: 'A Receber', company_id: DEMO_COMPANY_ID },
      { id: 'ar-2', invoice_number: 'NF-S-2026-002', customer_name: 'Construtora XYZ', category: 'Serviços', original_amount: 85000, final_amount: 85000, due_date: '2026-03-15', status: 'A Receber', company_id: DEMO_COMPANY_ID },
      { id: 'ar-3', invoice_number: 'NF-S-2025-120', customer_name: 'Distribuidora Nacional', category: 'Vendas', original_amount: 200000, final_amount: 200000, due_date: '2026-01-30', status: 'Recebido', receipt_date: '2026-01-29', company_id: DEMO_COMPANY_ID },
    ],
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
  // Financial approvals
  {
    queryKey: ['financial-approvals', DEMO_COMPANY_ID],
    data: [
      { id: 'fa-1', type: 'Conta a Pagar', description: 'NF-45680 - Manutenção Industrial', amount: 15000, requester: 'Ana Silva', status: 'Pendente', created_at: '2026-02-08' },
      { id: 'fa-2', type: 'Orçamento', description: 'Projeto de Energia Solar', amount: 180000, requester: 'Carlos Santos', status: 'Pendente', created_at: '2026-02-05' },
    ],
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
  // Financial reports
  {
    queryKey: ['financial-reports', DEMO_COMPANY_ID],
    data: [],
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
];
