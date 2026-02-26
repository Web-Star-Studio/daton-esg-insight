/**
 * Mock data for Organization modules (departments, positions, org chart)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const organizationMockEntries = [
  // Departments
  {
    queryKey: ['departments', DEMO_COMPANY_ID],
    data: [
      { id: 'dept-1', name: 'Diretoria', description: 'Diretoria executiva', parent_department_id: null, manager_employee_id: 'emp-5', budget: 2000000, cost_center: 'CC-001', company_id: DEMO_COMPANY_ID, employee_count: 5, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-2', name: 'Operações', description: 'Gerência de operações industriais', parent_department_id: 'dept-1', manager_employee_id: 'emp-1', budget: 5000000, cost_center: 'CC-001', company_id: DEMO_COMPANY_ID, employee_count: 120, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-3', name: 'Meio Ambiente', description: 'Gestão ambiental e sustentabilidade', parent_department_id: 'dept-1', manager_employee_id: 'emp-2', budget: 850000, cost_center: 'CC-005', company_id: DEMO_COMPANY_ID, employee_count: 15, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-4', name: 'Recursos Humanos', description: 'Gestão de pessoas', parent_department_id: 'dept-1', manager_employee_id: 'emp-3', budget: 1200000, cost_center: 'CC-002', company_id: DEMO_COMPANY_ID, employee_count: 12, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-5', name: 'SST', description: 'Saúde e segurança do trabalho', parent_department_id: 'dept-4', manager_employee_id: 'emp-4', budget: 400000, cost_center: 'CC-002', company_id: DEMO_COMPANY_ID, employee_count: 8, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-6', name: 'Financeiro', description: 'Gestão financeira e contábil', parent_department_id: 'dept-1', manager_employee_id: 'emp-5', budget: 800000, cost_center: 'CC-002', company_id: DEMO_COMPANY_ID, employee_count: 10, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-7', name: 'Qualidade', description: 'Gestão da qualidade e SGQ', parent_department_id: 'dept-2', manager_employee_id: 'emp-6', budget: 600000, cost_center: 'CC-001', company_id: DEMO_COMPANY_ID, employee_count: 8, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-8', name: 'Jurídico', description: 'Compliance e assuntos jurídicos', parent_department_id: 'dept-1', manager_employee_id: 'emp-7', budget: 500000, cost_center: 'CC-002', company_id: DEMO_COMPANY_ID, employee_count: 5, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'dept-9', name: 'Produção', description: 'Linha de produção e manufatura', parent_department_id: 'dept-2', manager_employee_id: 'emp-8', budget: 3500000, cost_center: 'CC-001', company_id: DEMO_COMPANY_ID, employee_count: 90, created_at: '2020-01-01', updated_at: '2026-01-01' },
    ],
  },
  // Departments (base)
  {
    queryKey: ['departments'],
    data: [
      { id: 'dept-1', name: 'Diretoria', employee_count: 5 },
      { id: 'dept-2', name: 'Operações', employee_count: 120 },
      { id: 'dept-3', name: 'Meio Ambiente', employee_count: 15 },
      { id: 'dept-4', name: 'Recursos Humanos', employee_count: 12 },
      { id: 'dept-9', name: 'Produção', employee_count: 90 },
    ],
  },
  // Positions
  {
    queryKey: ['positions', DEMO_COMPANY_ID],
    data: [
      { id: 'pos-1', title: 'Diretor(a) Geral', department_id: 'dept-1', level: 'Executivo', salary_range_min: 25000, salary_range_max: 45000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-2', title: 'Gerente de Operações', department_id: 'dept-2', level: 'Gerência', salary_range_min: 15000, salary_range_max: 25000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-3', title: 'Analista Ambiental Sr', department_id: 'dept-3', level: 'Sênior', salary_range_min: 8000, salary_range_max: 14000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-4', title: 'Coordenador(a) de RH', department_id: 'dept-4', level: 'Coordenação', salary_range_min: 10000, salary_range_max: 16000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-5', title: 'Técnico de Segurança', department_id: 'dept-5', level: 'Técnico', salary_range_min: 5000, salary_range_max: 9000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-6', title: 'Engenheiro(a) de Qualidade', department_id: 'dept-7', level: 'Pleno', salary_range_min: 7000, salary_range_max: 12000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-7', title: 'Supervisor(a) de Produção', department_id: 'dept-9', level: 'Supervisão', salary_range_min: 8000, salary_range_max: 13000, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'pos-8', title: 'Operador(a) de Máquinas', department_id: 'dept-9', level: 'Operacional', salary_range_min: 2500, salary_range_max: 4500, company_id: DEMO_COMPANY_ID, created_at: '2020-01-01', updated_at: '2026-01-01' },
    ],
  },
  // Positions (base)
  {
    queryKey: ['positions'],
    data: [
      { id: 'pos-1', title: 'Diretor(a) Geral', level: 'Executivo' },
      { id: 'pos-2', title: 'Gerente de Operações', level: 'Gerência' },
    ],
  },
  // Org chart
  {
    queryKey: ['org-chart', DEMO_COMPANY_ID],
    data: [
      {
        id: 'oc-1', employee_id: 'emp-5', hierarchy_level: 0, is_active: true, start_date: '2017-02-01',
        employee: { id: 'emp-5', full_name: 'Juliana Lima', position: 'Diretora Geral' },
        department: { id: 'dept-1', name: 'Diretoria' },
        subordinates: [
          {
            id: 'oc-2', employee_id: 'emp-1', hierarchy_level: 1, is_active: true, start_date: '2020-03-15',
            employee: { id: 'emp-1', full_name: 'Ana Silva', position: 'Gerente de Operações' },
            department: { id: 'dept-2', name: 'Operações' },
            subordinates: [
              { id: 'oc-6', employee_id: 'emp-6', hierarchy_level: 2, is_active: true, start_date: '2022-04-15', employee: { id: 'emp-6', full_name: 'Pedro Almeida', position: 'Eng. de Qualidade' }, department: { id: 'dept-7', name: 'Qualidade' }, subordinates: [] },
              { id: 'oc-8', employee_id: 'emp-8', hierarchy_level: 2, is_active: true, start_date: '2019-11-01', employee: { id: 'emp-8', full_name: 'Lucas Mendes', position: 'Supervisor de Produção' }, department: { id: 'dept-9', name: 'Produção' }, subordinates: [] },
            ],
          },
          {
            id: 'oc-3', employee_id: 'emp-2', hierarchy_level: 1, is_active: true, start_date: '2019-06-01',
            employee: { id: 'emp-2', full_name: 'Carlos Santos', position: 'Analista Ambiental Sr' },
            department: { id: 'dept-3', name: 'Meio Ambiente' },
            subordinates: [],
          },
          {
            id: 'oc-4', employee_id: 'emp-3', hierarchy_level: 1, is_active: true, start_date: '2021-01-10',
            employee: { id: 'emp-3', full_name: 'Mariana Costa', position: 'Coordenadora de RH' },
            department: { id: 'dept-4', name: 'Recursos Humanos' },
            subordinates: [
              { id: 'oc-5', employee_id: 'emp-4', hierarchy_level: 2, is_active: true, start_date: '2018-08-20', employee: { id: 'emp-4', full_name: 'Roberto Oliveira', position: 'Técnico de Segurança' }, department: { id: 'dept-5', name: 'SST' }, subordinates: [] },
            ],
          },
          {
            id: 'oc-7', employee_id: 'emp-7', hierarchy_level: 1, is_active: true, start_date: '2023-01-05',
            employee: { id: 'emp-7', full_name: 'Fernanda Rocha', position: 'Analista de Compliance' },
            department: { id: 'dept-8', name: 'Jurídico' },
            subordinates: [],
          },
        ],
      },
    ],
  },
  // Org chart (base)
  {
    queryKey: ['org-chart'],
    data: [
      {
        id: 'oc-1', employee_id: 'emp-5',
        employee: { id: 'emp-5', full_name: 'Juliana Lima', position: 'Diretora Geral' },
        department: { id: 'dept-1', name: 'Diretoria' },
        subordinates: [],
      },
    ],
  },
  // Job descriptions
  {
    queryKey: ['job-descriptions', DEMO_COMPANY_ID],
    data: [
      { id: 'jd-1', title: 'Analista Ambiental', department: 'Meio Ambiente', level: 'Pleno', status: 'Ativo', requirements: ['Graduação em Engenharia Ambiental', 'Experiência com inventário GEE'], company_id: DEMO_COMPANY_ID },
      { id: 'jd-2', title: 'Técnico de Segurança do Trabalho', department: 'SST', level: 'Técnico', status: 'Ativo', requirements: ['Formação técnica em SST', 'NR-12, NR-35'], company_id: DEMO_COMPANY_ID },
      { id: 'jd-3', title: 'Operador de Produção', department: 'Produção', level: 'Operacional', status: 'Ativo', requirements: ['Ensino Médio', 'Experiência industrial'], company_id: DEMO_COMPANY_ID },
    ],
  },
  // Job descriptions (base)
  {
    queryKey: ['job-descriptions'],
    data: [
      { id: 'jd-1', title: 'Analista Ambiental', department: 'Meio Ambiente', level: 'Pleno', status: 'Ativo' },
    ],
  },
  // Organizational config
  {
    queryKey: ['org-config', DEMO_COMPANY_ID],
    data: {
      company_name: 'EcoTech Indústria e Comércio S.A.',
      sector: 'Industrial',
      size: 'Médio Porte',
      total_departments: 9,
      total_positions: 28,
      total_employees: 342,
    },
  },
  // Org config (base)
  {
    queryKey: ['org-config'],
    data: {
      company_name: 'EcoTech Indústria e Comércio S.A.',
      sector: 'Industrial',
      total_employees: 342,
    },
  },
  // Organizational profile
  {
    queryKey: ['organizational-profile'],
    data: {
      id: DEMO_COMPANY_ID,
      name: 'Daton Demo',
      cnpj: '12.345.678/0001-90',
      sector: 'technology',
      legal_structure: 'corporation',
      headquarters_address: 'Av. Paulista, 1000 - São Paulo, SP',
      reporting_scope: 'GRI Standards e SASB',
      fiscal_year_start: '2025-01-01',
      fiscal_year_end: '2025-12-31',
      employee_count: 342,
      annual_revenue: 50000000,
      stock_exchange: 'B3',
      stock_symbol: 'DTON3',
      business_units: [
        { id: '1', name: 'Matriz - SP', location: 'São Paulo', employees: 150, revenue_percentage: 60 },
        { id: '2', name: 'Filial - RJ', location: 'Rio de Janeiro', employees: 80, revenue_percentage: 25 },
        { id: '3', name: 'Fábrica - MG', location: 'Minas Gerais', employees: 112, revenue_percentage: 15 }
      ],
      subsidiaries_included: [
        { id: '1', name: 'Daton Logística', country: 'Brasil', ownership_percentage: 100, included_in_scope: true }
      ],
      subsidiaries_excluded: []
    }
  },
  // Branches
  {
    queryKey: ['branches'],
    data: [
      { id: 'branch-1', company_id: DEMO_COMPANY_ID, name: 'Sede Global (Matriz)', is_headquarters: true, status: 'Ativo', city: 'São Paulo', state: 'SP', code: 'HQ-SP', cnpj: '12.345.678/0001-90', created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'branch-2', company_id: DEMO_COMPANY_ID, name: 'Fábrica Guarulhos', is_headquarters: false, status: 'Ativo', city: 'Guarulhos', state: 'SP', code: 'FAC-GRU', cnpj: '12.345.678/0002-71', parent_branch_id: 'branch-1', created_at: '2020-01-01', updated_at: '2026-01-01' },
      { id: 'branch-3', company_id: DEMO_COMPANY_ID, name: 'Centro de Distribuição RJ', is_headquarters: false, status: 'Ativo', city: 'Rio de Janeiro', state: 'RJ', code: 'CD-RJ', cnpj: '12.345.678/0003-52', parent_branch_id: 'branch-1', created_at: '2020-01-01', updated_at: '2026-01-01' }
    ]
  },
  {
    queryKey: ['branches', 'with-manager'],
    data: [
      { id: 'branch-1', company_id: DEMO_COMPANY_ID, name: 'Sede Global (Matriz)', is_headquarters: true, status: 'Ativo', city: 'São Paulo', state: 'SP', code: 'HQ-SP', cnpj: '12.345.678/0001-90', created_at: '2020-01-01', updated_at: '2026-01-01', manager: { id: 'emp-5', full_name: 'Juliana Lima' } },
      { id: 'branch-2', company_id: DEMO_COMPANY_ID, name: 'Fábrica Guarulhos', is_headquarters: false, status: 'Ativo', city: 'Guarulhos', state: 'SP', code: 'FAC-GRU', cnpj: '12.345.678/0002-71', parent_branch_id: 'branch-1', parent_branch: { id: 'branch-1', name: 'Sede Global (Matriz)' }, created_at: '2020-01-01', updated_at: '2026-01-01', manager: { id: 'emp-1', full_name: 'Ana Silva' } },
      { id: 'branch-3', company_id: DEMO_COMPANY_ID, name: 'Centro de Distribuição RJ', is_headquarters: false, status: 'Ativo', city: 'Rio de Janeiro', state: 'RJ', code: 'CD-RJ', cnpj: '12.345.678/0003-52', parent_branch_id: 'branch-1', parent_branch: { id: 'branch-1', name: 'Sede Global (Matriz)' }, created_at: '2020-01-01', updated_at: '2026-01-01', manager: { id: 'emp-2', full_name: 'Carlos Santos' } }
    ]
  }
];
