/**
 * Mock data for Settings modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_USER_DIRECTORY = [
  {
    id: 'demo-user-001',
    full_name: 'Usuário Demonstração',
    email: 'demo@ecotech.com.br',
    username: 'demo.user',
    role: 'viewer',
    company_id: DEMO_COMPANY_ID,
    department: 'Sustentabilidade',
    is_active: true,
    created_at: '2025-11-01T08:30:00Z',
  },
  {
    id: 'demo-user-002',
    full_name: 'Mariana Lopes',
    email: 'mariana.lopes@ecotech.com.br',
    username: 'mariana.lopes',
    role: 'admin',
    company_id: DEMO_COMPANY_ID,
    department: 'Qualidade',
    is_active: true,
    created_at: '2025-08-15T09:00:00Z',
  },
  {
    id: 'demo-user-003',
    full_name: 'Carlos Andrade',
    email: 'carlos.andrade@ecotech.com.br',
    username: 'carlos.andrade',
    role: 'manager',
    company_id: DEMO_COMPANY_ID,
    department: 'Operações',
    is_active: true,
    created_at: '2025-06-20T10:10:00Z',
  },
  {
    id: 'demo-user-004',
    full_name: 'Fernanda Rocha',
    email: 'fernanda.rocha@ecotech.com.br',
    username: 'fernanda.rocha',
    role: 'analyst',
    company_id: DEMO_COMPANY_ID,
    department: 'Compliance',
    is_active: true,
    created_at: '2025-09-05T11:20:00Z',
  },
  {
    id: 'demo-user-005',
    full_name: 'Paulo Alves',
    email: 'paulo.alves@ecotech.com.br',
    username: 'paulo.alves',
    role: 'auditor',
    company_id: DEMO_COMPANY_ID,
    department: 'Auditoria',
    is_active: false,
    created_at: '2024-12-10T14:50:00Z',
  },
];

export const settingsMockEntries = [
  // Company/branches
  {
    queryKey: ['branches', DEMO_COMPANY_ID],
    data: [
      { id: 'branch-1', name: 'Unidade Industrial SP', type: 'Fábrica', city: 'São Paulo', state: 'SP', address: 'Av. Industrial, 1500', is_headquarters: true, employee_count: 250, company_id: DEMO_COMPANY_ID, status: 'Ativo' },
      { id: 'branch-2', name: 'Centro de Distribuição RJ', type: 'Distribuição', city: 'Rio de Janeiro', state: 'RJ', address: 'Rod. Presidente Dutra, Km 210', is_headquarters: false, employee_count: 52, company_id: DEMO_COMPANY_ID, status: 'Ativo' },
      { id: 'branch-3', name: 'Escritório Administrativo', type: 'Escritório', city: 'São Paulo', state: 'SP', address: 'Av. Paulista, 2000', is_headquarters: false, employee_count: 40, company_id: DEMO_COMPANY_ID, status: 'Ativo' },
    ],
  },
  // Branches (base)
  {
    queryKey: ['branches'],
    data: [
      { id: 'branch-1', name: 'Unidade Industrial SP', type: 'Fábrica', employee_count: 250, status: 'Ativo' },
      { id: 'branch-2', name: 'Centro de Distribuição RJ', type: 'Distribuição', employee_count: 52, status: 'Ativo' },
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
  // System settings (base)
  {
    queryKey: ['system-settings'],
    data: {
      company_name: 'EcoTech Indústria e Comércio S.A.',
      cnpj: '12.345.678/0001-90',
      sector: 'Industrial',
      employee_count: 342,
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
    data: DEMO_USER_DIRECTORY,
  },
  // Company users (base)
  {
    queryKey: ['company-users'],
    data: DEMO_USER_DIRECTORY,
  },
  // Generic users list (compliance/tasks)
  {
    queryKey: ['users'],
    data: DEMO_USER_DIRECTORY,
  },
  // Users list with roles for permission tab
  {
    queryKey: ['company-users-roles'],
    data: DEMO_USER_DIRECTORY.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      company_id: user.company_id,
      role: user.role,
    })),
  },
  // Branches used by non-conformity flow
  {
    queryKey: ['branches-for-nc'],
    data: [
      { id: 'branch-1', name: 'Unidade Industrial SP', is_headquarters: true },
      { id: 'branch-2', name: 'Centro de Distribuição RJ', is_headquarters: false },
      { id: 'branch-3', name: 'Escritório Administrativo', is_headquarters: false },
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
  // Custom forms (base)
  {
    queryKey: ['custom-forms'],
    data: [
      { id: 'form-1', title: 'Formulário de Inspeção Ambiental', status: 'Publicado', responses_count: 45 },
      { id: 'form-2', title: 'Checklist de Segurança Diário', status: 'Publicado', responses_count: 320 },
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
  // Notifications (base)
  {
    queryKey: ['notifications'],
    data: [
      { id: 'n-1', title: 'Bem-vindo ao modo demonstração', message: 'Explore todas as funcionalidades', read: false, created_at: new Date().toISOString() },
    ],
  },
  // Module settings
  {
    queryKey: ['platform-module-settings'],
    data: [
      {
        id: 'ms-1',
        module_key: 'financial',
        module_name: 'Financeiro',
        enabled_live: true,
        enabled_demo: true,
        updated_at: new Date().toISOString(),
        updated_by_user_id: 'demo-user-001',
      },
      {
        id: 'ms-2',
        module_key: 'dataReports',
        module_name: 'Dados e Relatórios',
        enabled_live: true,
        enabled_demo: true,
        updated_at: new Date().toISOString(),
        updated_by_user_id: 'demo-user-001',
      },
      {
        id: 'ms-3',
        module_key: 'quality',
        module_name: 'SGQ',
        enabled_live: true,
        enabled_demo: true,
        updated_at: new Date().toISOString(),
        updated_by_user_id: 'demo-user-001',
      },
      {
        id: 'ms-4',
        module_key: 'suppliers',
        module_name: 'Fornecedores',
        enabled_live: true,
        enabled_demo: true,
        updated_at: new Date().toISOString(),
        updated_by_user_id: 'demo-user-001',
      },
      {
        id: 'ms-5',
        module_key: 'esgManagement',
        module_name: 'Gestão ESG',
        enabled_live: true,
        enabled_demo: true,
        updated_at: new Date().toISOString(),
        updated_by_user_id: 'demo-user-001',
      },
    ],
  },
  // Profiles
  {
    queryKey: ['profiles'],
    data: [
      { id: 'demo-user-001', full_name: 'Usuário Demonstração', email: 'demo@ecotech.com.br', role: 'viewer', company_id: DEMO_COMPANY_ID },
    ],
  },
  // User profile
  {
    queryKey: ['user-profile'],
    data: {
      id: 'demo-user-001',
      full_name: 'Usuário Demonstração',
      email: 'demo@ecotech.com.br',
      role: 'viewer',
      company_id: DEMO_COMPANY_ID,
      avatar_url: null,
    },
  },
  // Activity logs
  {
    queryKey: ['activity-logs'],
    data: [
      { id: 'al-1', action_type: 'login', description: 'Login no modo demo', user_id: 'demo-user-001', created_at: new Date().toISOString() },
    ],
  },
  // Audit categories
  {
    queryKey: ['audit-categories'],
    data: [
      { id: 'ac-1', title: 'Ambiental', description: 'Auditorias ambientais', is_active: true },
      { id: 'ac-2', title: 'Qualidade', description: 'Auditorias do SGQ', is_active: true },
      { id: 'ac-3', title: 'Segurança', description: 'Auditorias de SST', is_active: true },
    ],
  },
  // Approval workflows
  {
    queryKey: ['approval-workflows'],
    data: [
      {
        id: 'aw-1',
        workflow_name: 'Aprovação de Não Conformidades',
        name: 'Aprovação de Não Conformidades',
        workflow_type: 'non_conformity',
        is_active: true,
        created_at: '2026-01-10T08:00:00Z',
        steps: [
          { approver_user_id: 'demo-user-001', step_number: 1, approver_name: 'Usuário Demonstração' },
          { approver_user_id: 'demo-user-002', step_number: 2, approver_name: 'Mariana Lopes' },
        ],
      },
      {
        id: 'aw-2',
        workflow_name: 'Aprovação de Documentos Externos',
        name: 'Aprovação de Documentos Externos',
        workflow_type: 'document',
        is_active: true,
        created_at: '2026-01-16T11:20:00Z',
        steps: [
          { approver_user_id: 'demo-user-003', step_number: 1, approver_name: 'Carlos Andrade' },
        ],
      },
    ],
  },
  // Tags
  {
    queryKey: ['tags'],
    data: [
      { id: 'tag-1', name: 'ESG', color: '#10b981' },
      { id: 'tag-2', name: 'Urgente', color: '#ef4444' },
      { id: 'tag-3', name: 'Qualidade', color: '#3b82f6' },
    ],
  },
  // Custom permissions — PermissionGate.tsx (queryKey: ['custom-permissions', userId])
  // Prefix entry: catches ['custom-permissions', anyUserId]. Returns empty array → no custom overrides in demo.
  {
    queryKey: ['custom-permissions'],
    data: [],
  },
  // Current user — usePermissions hook (queryKey: ['current-user'])
  // Consistent with DEMO_USER_DIRECTORY entry for demo-user-001
  {
    queryKey: ['current-user'],
    data: { id: 'demo-user-001', email: 'demo@ecotech.com.br' },
  },
  // User role — usePermissions hook (queryKey: ['user-role', userId])
  // Prefix entry catches any ['user-role', anyId]. 'platform_admin' triggers the
  // hasPermission() short-circuit → all PermissionGate content visible in demo.
  {
    queryKey: ['user-role'],
    data: 'platform_admin',
  },
  // Role permissions — usePermissions hook (queryKey: ['role-permissions', role])
  // Prefix entry catches any ['role-permissions', anyRole]. Empty array is safe;
  // with platform_admin the .some() call is never reached anyway.
  {
    queryKey: ['role-permissions'],
    data: [],
  },
  // Mailing list details — prevent fallback data from crashing MailingListDetailsModal
  // (fallback returns array because 'list' is in LIST_LIKE_KEYWORDS, but modal expects single object)
  {
    queryKey: ['mailing-list-details'],
    data: null,
  },
  // Listas de Envio
  {
    queryKey: ['mailing-lists'],
    data: [
      { id: 'ml-1', name: 'Fornecedores ESG', description: 'Lista de fornecedores para formulários de avaliação ESG', company_id: DEMO_COMPANY_ID, created_by_user_id: 'demo-user-001', contact_count: 24, form_count: 3, created_at: '2025-09-15T10:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
      { id: 'ml-2', name: 'Colaboradores — SIPAT', description: 'Lista de colaboradores para campanhas de segurança do trabalho', company_id: DEMO_COMPANY_ID, created_by_user_id: 'demo-user-001', contact_count: 87, form_count: 2, created_at: '2025-10-01T09:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
      { id: 'ml-3', name: 'Stakeholders Externos', description: 'Comunidades, ONGs e órgãos regulatórios parceiros', company_id: DEMO_COMPANY_ID, created_by_user_id: 'demo-user-002', contact_count: 12, form_count: 1, created_at: '2025-11-10T14:00:00Z', updated_at: '2026-02-15T00:00:00Z' },
    ],
  },
];
