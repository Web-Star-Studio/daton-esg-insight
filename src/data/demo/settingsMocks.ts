/**
 * Mock data for Settings modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const settingsMockEntries = [
  // Company/branches
  {
    queryKey: ['branches', DEMO_COMPANY_ID],
    data: [
      { id: 'branch-1', name: 'Unidade Industrial SP', type: 'Fábrica', city: 'São Paulo', state: 'SP', address: 'Av. Industrial, 1500', is_headquarters: true, employee_count: 250, company_id: DEMO_COMPANY_ID },
      { id: 'branch-2', name: 'Centro de Distribuição RJ', type: 'Distribuição', city: 'Rio de Janeiro', state: 'RJ', address: 'Rod. Presidente Dutra, Km 210', is_headquarters: false, employee_count: 52, company_id: DEMO_COMPANY_ID },
      { id: 'branch-3', name: 'Escritório Administrativo', type: 'Escritório', city: 'São Paulo', state: 'SP', address: 'Av. Paulista, 2000', is_headquarters: false, employee_count: 40, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Settings/config
  {
    queryKey: ['system-settings', DEMO_COMPANY_ID],
    data: {
      company_name: 'EcoTech Indústria e Comércio S.A.',
      cnpj: '12.345.678/0001-90',
      sector: 'Industrial',
      employee_count: 342,
      fiscal_year_start: '01-01',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      notifications_enabled: true,
    },
  },
  // Company profile for demo user
  {
    queryKey: ['auth', 'user'],
    data: {
      id: 'demo-user-001',
      email: 'demo@ecotech.com.br',
      full_name: 'Usuário Demonstração',
      role: 'viewer',
      company_id: DEMO_COMPANY_ID,
      is_approved: false,
    },
  },
  // Users list
  {
    queryKey: ['company-users', undefined],
    data: [
      { id: 'demo-user-001', full_name: 'Usuário Demonstração', role: 'viewer' },
    ],
  },
  // Custom forms
  {
    queryKey: ['custom-forms', DEMO_COMPANY_ID],
    data: [
      { id: 'form-1', title: 'Formulário de Inspeção Ambiental', status: 'Publicado', responses_count: 45, created_at: '2025-06-01' },
      { id: 'form-2', title: 'Checklist de Segurança Diário', status: 'Publicado', responses_count: 320, created_at: '2025-03-15' },
      { id: 'form-3', title: 'Pesquisa de Satisfação Interna', status: 'Rascunho', responses_count: 0, created_at: '2026-01-20' },
    ],
  },
  // Notifications
  {
    queryKey: ['notifications', 'demo-user-001'],
    data: [
      { id: 'n-1', title: 'Bem-vindo ao modo demonstração', message: 'Explore todas as funcionalidades da plataforma', read: false, created_at: new Date().toISOString() },
      { id: 'n-2', title: 'Sua conta está em análise', message: 'O administrador foi notificado sobre seu cadastro', read: false, created_at: new Date().toISOString() },
    ],
  },
  // Module settings
  {
    queryKey: ['platform-module-settings'],
    data: [],
  },
];
