/**
 * Mock data for Social ESG modules (employees, training, safety, career)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const demoEmployees = [
  { id: 'emp-1', employee_code: 'A001', cpf: '123.456.789-01', full_name: 'Ana Silva', position: 'Gerente de Operações', department: 'Operações', status: 'Ativo', gender: 'Feminino', hire_date: '2020-03-15', employment_type: 'CLT', location: 'São Paulo', salary: 18500, email: 'ana.silva@demo.com', phone: '(11) 99111-0001', company_id: DEMO_COMPANY_ID, created_at: '2020-03-15T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-2', employee_code: 'A002', cpf: '234.567.890-12', full_name: 'Carlos Santos', position: 'Analista Ambiental Sr', department: 'Meio Ambiente', status: 'Ativo', gender: 'Masculino', hire_date: '2019-06-01', employment_type: 'CLT', location: 'Rio de Janeiro', salary: 12400, email: 'carlos.santos@demo.com', phone: '(21) 99222-0002', company_id: DEMO_COMPANY_ID, created_at: '2019-06-01T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-3', employee_code: 'A003', cpf: '345.678.901-23', full_name: 'Mariana Costa', position: 'Coordenadora de RH', department: 'Recursos Humanos', status: 'Ativo', gender: 'Feminino', hire_date: '2021-01-10', employment_type: 'CLT', location: 'São Paulo', salary: 11200, email: 'mariana.costa@demo.com', phone: '(11) 99333-0003', company_id: DEMO_COMPANY_ID, created_at: '2021-01-10T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-4', employee_code: 'A004', cpf: '456.789.012-34', full_name: 'Roberto Oliveira', position: 'Técnico de Segurança', department: 'SST', status: 'Ativo', gender: 'Masculino', hire_date: '2018-08-20', employment_type: 'CLT', location: 'São Paulo', salary: 6900, email: 'roberto.oliveira@demo.com', phone: '(11) 99444-0004', company_id: DEMO_COMPANY_ID, created_at: '2018-08-20T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-5', employee_code: 'A005', cpf: '567.890.123-45', full_name: 'Juliana Lima', position: 'Diretora Financeira', department: 'Financeiro', status: 'Ativo', gender: 'Feminino', hire_date: '2017-02-01', employment_type: 'CLT', location: 'São Paulo', salary: 28000, email: 'juliana.lima@demo.com', phone: '(11) 99555-0005', company_id: DEMO_COMPANY_ID, created_at: '2017-02-01T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-6', employee_code: 'A006', cpf: '678.901.234-56', full_name: 'Pedro Almeida', position: 'Engenheiro de Qualidade', department: 'Qualidade', status: 'Ativo', gender: 'Masculino', hire_date: '2022-04-15', employment_type: 'CLT', location: 'São Paulo', salary: 9800, email: 'pedro.almeida@demo.com', phone: '(11) 99666-0006', company_id: DEMO_COMPANY_ID, created_at: '2022-04-15T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-7', employee_code: 'A007', cpf: '789.012.345-67', full_name: 'Fernanda Rocha', position: 'Analista de Compliance', department: 'Jurídico', status: 'Inativo', gender: 'Feminino', hire_date: '2023-01-05', employment_type: 'CLT', location: 'Belo Horizonte', salary: 9200, email: 'fernanda.rocha@demo.com', phone: '(31) 99777-0007', company_id: DEMO_COMPANY_ID, created_at: '2023-01-05T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
  { id: 'emp-8', employee_code: 'A008', cpf: '890.123.456-78', full_name: 'Lucas Mendes', position: 'Supervisor de Produção', department: 'Produção', status: 'Ativo', gender: 'Masculino', hire_date: '2019-11-01', employment_type: 'CLT', location: 'São Paulo', salary: 8600, email: 'lucas.mendes@demo.com', phone: '(11) 99888-0008', company_id: DEMO_COMPANY_ID, created_at: '2019-11-01T09:00:00Z', updated_at: '2026-01-15T09:00:00Z' },
];

const DEMO_EMPLOYEE_DEPARTMENTS = [...new Set(demoEmployees.map((employee) => employee.department))];

const DEMO_EMPLOYEE_STATS = {
  totalEmployees: demoEmployees.length,
  activeEmployees: demoEmployees.filter((employee) => employee.status === 'Ativo').length,
  departments: DEMO_EMPLOYEE_DEPARTMENTS.length,
  genderDistribution: {
    Feminino: demoEmployees.filter((employee) => employee.gender === 'Feminino').length,
    Masculino: demoEmployees.filter((employee) => employee.gender === 'Masculino').length,
  },
  avgSalary: Math.round(
    demoEmployees.reduce((sum, employee) => sum + (employee.salary || 0), 0) / demoEmployees.length,
  ),
};

const DEMO_SOCIAL_FILTER_OPTIONS = {
  locations: [...new Set(demoEmployees.map((employee) => employee.location).filter(Boolean))],
  departments: DEMO_EMPLOYEE_DEPARTMENTS,
  positions: [...new Set(demoEmployees.map((employee) => employee.position).filter(Boolean))],
};

const DEMO_TRAINING_CATEGORIES = [
  { id: 'cat-1', name: 'Segurança', description: 'Treinamentos obrigatórios de SST', company_id: DEMO_COMPANY_ID, created_at: '2025-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'cat-2', name: 'Ambiental', description: 'Capacitações de gestão ambiental', company_id: DEMO_COMPANY_ID, created_at: '2025-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'cat-3', name: 'Desenvolvimento', description: 'Desenvolvimento de liderança e competências', company_id: DEMO_COMPANY_ID, created_at: '2025-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'cat-4', name: 'Compliance', description: 'Ética, LGPD e controles internos', company_id: DEMO_COMPANY_ID, created_at: '2025-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
];

const DEMO_TRAINING_PROGRAMS = [
  {
    id: '1',
    company_id: DEMO_COMPANY_ID,
    name: 'NR-12 Segurança em Máquinas',
    description: 'Capacitação obrigatória para operação segura de máquinas industriais.',
    category: 'Segurança',
    duration_hours: 16,
    is_mandatory: true,
    valid_for_months: 12,
    start_date: '2026-01-15',
    end_date: '2026-01-16',
    created_by_user_id: 'demo-user-1',
    status: 'Concluído',
    responsible_name: 'João Pereira',
    created_at: '2025-12-10T09:00:00Z',
    updated_at: '2026-01-30T18:00:00Z',
  },
  {
    id: '2',
    company_id: DEMO_COMPANY_ID,
    name: 'Gestão de Resíduos Sólidos',
    description: 'Boas práticas de segregação, armazenamento e destinação de resíduos.',
    category: 'Ambiental',
    duration_hours: 8,
    is_mandatory: true,
    valid_for_months: 24,
    start_date: '2026-01-20',
    end_date: '2026-01-20',
    created_by_user_id: 'demo-user-1',
    status: 'Concluído',
    responsible_name: 'Maria Santos',
    created_at: '2025-12-12T10:00:00Z',
    updated_at: '2026-01-25T17:30:00Z',
  },
  {
    id: '3',
    company_id: DEMO_COMPANY_ID,
    name: 'Liderança e Gestão de Equipes',
    description: 'Treinamento focado em liderança situacional e gestão de desempenho.',
    category: 'Desenvolvimento',
    duration_hours: 24,
    is_mandatory: false,
    valid_for_months: 36,
    start_date: '2026-02-01',
    end_date: '2026-02-03',
    created_by_user_id: 'demo-user-1',
    status: 'Em Andamento',
    responsible_name: 'Ricardo Lima',
    created_at: '2026-01-05T11:00:00Z',
    updated_at: '2026-02-03T14:10:00Z',
  },
  {
    id: '4',
    company_id: DEMO_COMPANY_ID,
    name: 'Primeiros Socorros',
    description: 'Procedimentos iniciais de atendimento em emergências ocupacionais.',
    category: 'Segurança',
    duration_hours: 12,
    is_mandatory: true,
    valid_for_months: 24,
    start_date: '2026-03-15',
    end_date: '2026-03-16',
    created_by_user_id: 'demo-user-1',
    status: 'Planejado',
    responsible_name: 'Dra. Ana Souza',
    created_at: '2026-01-22T09:45:00Z',
    updated_at: '2026-01-22T09:45:00Z',
  },
  {
    id: '5',
    company_id: DEMO_COMPANY_ID,
    name: 'ISO 14001 - Auditor Interno',
    description: 'Formação para condução de auditorias internas do sistema de gestão ambiental.',
    category: 'Compliance',
    duration_hours: 40,
    is_mandatory: false,
    valid_for_months: 36,
    start_date: '2025-11-01',
    end_date: '2025-11-05',
    created_by_user_id: 'demo-user-1',
    status: 'Pendente Avaliação',
    responsible_name: 'Paulo Alves',
    created_at: '2025-09-18T08:30:00Z',
    updated_at: '2026-01-10T12:00:00Z',
  },
];

const DEMO_EMPLOYEE_TRAININGS = [
  {
    id: 'et-1',
    employee_id: 'emp-1',
    training_program_id: '1',
    status: 'Concluído',
    score: 92,
    completion_date: '2026-01-30',
    created_at: '2026-01-05T09:00:00Z',
    employee: { id: 'emp-1', full_name: 'Ana Silva', employee_code: 'A001', department: 'Operações' },
    training_program: { id: '1', name: 'NR-12 Segurança em Máquinas', category: 'Segurança', is_mandatory: true, duration_hours: 16 },
  },
  {
    id: 'et-2',
    employee_id: 'emp-2',
    training_program_id: '2',
    status: 'Concluído',
    score: 88,
    completion_date: '2026-01-25',
    created_at: '2026-01-07T10:15:00Z',
    employee: { id: 'emp-2', full_name: 'Carlos Santos', employee_code: 'A002', department: 'Meio Ambiente' },
    training_program: { id: '2', name: 'Gestão de Resíduos Sólidos', category: 'Ambiental', is_mandatory: true, duration_hours: 8 },
  },
  {
    id: 'et-3',
    employee_id: 'emp-3',
    training_program_id: '3',
    status: 'Inscrito',
    score: null,
    completion_date: null,
    created_at: '2026-02-03T14:40:00Z',
    employee: { id: 'emp-3', full_name: 'Mariana Costa', employee_code: 'A003', department: 'Recursos Humanos' },
    training_program: { id: '3', name: 'Liderança e Gestão de Equipes', category: 'Desenvolvimento', is_mandatory: false, duration_hours: 24 },
  },
  {
    id: 'et-4',
    employee_id: 'emp-4',
    training_program_id: '1',
    status: 'Concluído',
    score: 84,
    completion_date: '2026-02-02',
    created_at: '2026-01-09T08:20:00Z',
    employee: { id: 'emp-4', full_name: 'Roberto Oliveira', employee_code: 'A004', department: 'SST' },
    training_program: { id: '1', name: 'NR-12 Segurança em Máquinas', category: 'Segurança', is_mandatory: true, duration_hours: 16 },
  },
  {
    id: 'et-5',
    employee_id: 'emp-6',
    training_program_id: '5',
    status: 'Concluído',
    score: 95,
    completion_date: '2025-12-20',
    created_at: '2025-11-01T09:10:00Z',
    employee: { id: 'emp-6', full_name: 'Pedro Almeida', employee_code: 'A006', department: 'Qualidade' },
    training_program: { id: '5', name: 'ISO 14001 - Auditor Interno', category: 'Compliance', is_mandatory: false, duration_hours: 40 },
  },
];

const DEMO_ACTIVE_EMPLOYEES_FOR_TRAINING = demoEmployees
  .filter((employee) => employee.status === 'Ativo')
  .map((employee) => ({
    id: employee.id,
    full_name: employee.full_name,
    employee_code: employee.employee_code,
    department: employee.department,
  }));

const DEMO_TRAINING_PARTICIPANTS = DEMO_EMPLOYEE_TRAININGS.map((training) => ({
  id: training.id,
  employee_id: training.employee_id,
  employee_name: training.employee?.full_name || "N/A",
  employee_code: training.employee?.employee_code || "N/A",
  department: training.employee?.department || "N/A",
  status: training.status,
}));

const DEMO_TRAINING_EXPORT_PREVIEW = {
  headers: ['Funcionário', 'Filial', 'Setor', 'Função', 'Horas Totais', 'Treinamentos'],
  rows: [
    ['Pedro Almeida', 'São Paulo', 'Qualidade', 'Engenheiro de Qualidade', 56, 2],
    ['Ana Silva', 'São Paulo', 'Operações', 'Gerente de Operações', 48, 2],
    ['Carlos Santos', 'Rio de Janeiro', 'Meio Ambiente', 'Analista Ambiental Sr', 44, 2],
    ['Roberto Oliveira', 'São Paulo', 'SST', 'Técnico de Segurança', 40, 2],
    ['Mariana Costa', 'São Paulo', 'Recursos Humanos', 'Coordenadora de RH', 36, 1],
  ],
  summary: {
    totalHours: 224,
    totalEmployees: 5,
    avgHours: 44.8,
  },
};

const DEMO_TRAINING_METRICS = {
  totalTrainings: 126,
  completedTrainings: 98,
  completionRate: 77.8,
  averageScore: 87.6,
  totalHoursTrained: 1428,
  averageHoursPerEmployee: 38.4,
  categoryDistribution: {
    Segurança: 42,
    Ambiental: 31,
    Desenvolvimento: 28,
    Compliance: 25,
  },
  expiringIn30Days: 7,
  expiringIn60Days: 13,
  expiredCount: 3,
  complianceRate: 82.4,
  trainingsByDepartment: {
    Operações: 34,
    'Meio Ambiente': 21,
    'Recursos Humanos': 15,
    SST: 18,
    Qualidade: 22,
    Financeiro: 16,
  },
  monthlyTrend: [
    { month: 'Set', completed: 12, enrolled: 15 },
    { month: 'Out', completed: 14, enrolled: 17 },
    { month: 'Nov', completed: 15, enrolled: 18 },
    { month: 'Dez', completed: 18, enrolled: 21 },
    { month: 'Jan', completed: 19, enrolled: 23 },
    { month: 'Fev', completed: 20, enrolled: 24 },
  ],
  topPerformers: [
    { employee: 'Pedro Almeida', avgScore: 95, count: 6 },
    { employee: 'Ana Silva', avgScore: 92, count: 5 },
    { employee: 'Carlos Santos', avgScore: 88, count: 4 },
    { employee: 'Roberto Oliveira', avgScore: 84, count: 5 },
  ],
  departmentRanking: [
    { department: 'Qualidade', avgScore: 91.2, completionRate: 84.4 },
    { department: 'Operações', avgScore: 88.5, completionRate: 80.2 },
    { department: 'Meio Ambiente', avgScore: 87.1, completionRate: 78.4 },
    { department: 'SST', avgScore: 83.3, completionRate: 75.0 },
  ],
  statusDistribution: {
    Concluído: 98,
    Inscrito: 18,
    'Em Andamento': 10,
  },
};

const DEMO_SAFETY_METRICS = {
  totalIncidents: 3,
  daysLostTotal: 6,
  withMedicalTreatment: 2,
  accidentsWithLostTime: 1,
  ltifr: 1.72,
  severityRate: 8.44,
  avgResolutionTime: 9.5,
  severityDistribution: {
    Baixa: 1,
    Média: 1,
    Alta: 1,
  },
  incidentTrend: [
    { month: 1, incidents: 1 },
    { month: 2, incidents: 0 },
    { month: 3, incidents: 0 },
    { month: 4, incidents: 1 },
    { month: 5, incidents: 0 },
    { month: 6, incidents: 0 },
    { month: 7, incidents: 0 },
    { month: 8, incidents: 1 },
    { month: 9, incidents: 0 },
    { month: 10, incidents: 0 },
    { month: 11, incidents: 0 },
    { month: 12, incidents: 0 },
  ],
  ltifr_metadata: {
    worked_hours: 582000,
    calculation_method: 'timesheets+employees',
    data_quality: 'high',
    confidence_level: 'high',
    formula: 'LTIFR = (Nº Acidentes com Afastamento × 1.000.000) / Horas Trabalhadas',
    compliance: 'OIT/ISO 45001',
  },
};

const DEMO_SOCIAL_PROJECTS = [
  {
    id: 'sp-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Jovem Futuro',
    description: 'Programa de qualificação para jovens em situação de vulnerabilidade.',
    objective: 'Empregabilidade e inclusão social',
    target_audience: 'Jovens de 16 a 24 anos',
    location: 'São Paulo - SP',
    start_date: '2025-08-01',
    end_date: '2026-07-31',
    budget: 280000,
    invested_amount: 195000,
    status: 'Em Andamento',
    impact_metrics: { beneficiaries_reached: 180 },
    created_at: '2025-07-10T10:00:00Z',
    updated_at: '2026-02-10T09:30:00Z',
  },
  {
    id: 'sp-2',
    company_id: DEMO_COMPANY_ID,
    name: 'Saúde na Comunidade',
    description: 'Mutirões de saúde preventiva em bairros próximos às operações.',
    objective: 'Promoção de saúde básica',
    target_audience: 'Comunidade local',
    location: 'Rio de Janeiro - RJ',
    start_date: '2025-10-15',
    end_date: '2026-10-15',
    budget: 240000,
    invested_amount: 112500,
    status: 'Em Andamento',
    impact_metrics: { beneficiaries_reached: 620 },
    created_at: '2025-09-20T14:00:00Z',
    updated_at: '2026-02-12T16:10:00Z',
  },
  {
    id: 'sp-3',
    company_id: DEMO_COMPANY_ID,
    name: 'Mulheres na Indústria',
    description: 'Capacitação técnica e mentoria para mulheres na operação.',
    objective: 'Diversidade e inclusão',
    target_audience: 'Mulheres em início de carreira',
    location: 'Belo Horizonte - MG',
    start_date: '2024-11-01',
    end_date: '2025-12-31',
    budget: 180000,
    invested_amount: 180000,
    status: 'Concluído',
    impact_metrics: { beneficiaries_reached: 95 },
    created_at: '2024-10-12T10:30:00Z',
    updated_at: '2026-01-05T11:00:00Z',
  },
];

const DEMO_SOCIAL_METRICS = {
  totalProjects: DEMO_SOCIAL_PROJECTS.length,
  activeProjects: DEMO_SOCIAL_PROJECTS.filter((project) => project.status === 'Em Andamento').length,
  completedProjects: DEMO_SOCIAL_PROJECTS.filter((project) => project.status === 'Concluído').length,
  totalInvestment: DEMO_SOCIAL_PROJECTS.reduce((sum, project) => sum + (project.invested_amount || 0), 0),
  totalBudget: DEMO_SOCIAL_PROJECTS.reduce((sum, project) => sum + (project.budget || 0), 0),
  budgetUtilization: 75.5,
  statusDistribution: {
    Planejado: 0,
    'Em Andamento': 2,
    Concluído: 1,
    Cancelado: 0,
  },
  beneficiariesReached: 895,
  averageInvestmentPerProject: 162500,
};

const DEMO_FILTERED_TRAINING_METRICS = {
  totalEmployees: 8,
  totalHours: 304,
  avgHours: 38,
  employeeDetails: [
    { employee_id: 'emp-6', employee_name: 'Pedro Almeida', location: 'São Paulo', department: 'Qualidade', position: 'Engenheiro de Qualidade', hours: 56 },
    { employee_id: 'emp-1', employee_name: 'Ana Silva', location: 'São Paulo', department: 'Operações', position: 'Gerente de Operações', hours: 48 },
    { employee_id: 'emp-2', employee_name: 'Carlos Santos', location: 'Rio de Janeiro', department: 'Meio Ambiente', position: 'Analista Ambiental Sr', hours: 44 },
    { employee_id: 'emp-4', employee_name: 'Roberto Oliveira', location: 'São Paulo', department: 'SST', position: 'Técnico de Segurança', hours: 40 },
    { employee_id: 'emp-3', employee_name: 'Mariana Costa', location: 'São Paulo', department: 'Recursos Humanos', position: 'Coordenadora de RH', hours: 36 },
  ],
  hoursByLocation: [
    { name: 'São Paulo', hours: 224, avgHours: 37.3, employees: 6 },
    { name: 'Rio de Janeiro', hours: 80, avgHours: 40.0, employees: 2 },
  ],
  hoursByDepartment: [
    { name: 'Operações', hours: 82, avgHours: 41.0, employees: 2 },
    { name: 'Qualidade', hours: 56, avgHours: 56.0, employees: 1 },
    { name: 'Meio Ambiente', hours: 44, avgHours: 44.0, employees: 1 },
    { name: 'SST', hours: 40, avgHours: 40.0, employees: 1 },
    { name: 'Recursos Humanos', hours: 36, avgHours: 36.0, employees: 1 },
  ],
  hoursByPosition: [
    { name: 'Gerente de Operações', hours: 48, avgHours: 48, employees: 1 },
    { name: 'Analista Ambiental Sr', hours: 44, avgHours: 44, employees: 1 },
    { name: 'Engenheiro de Qualidade', hours: 56, avgHours: 56, employees: 1 },
  ],
};

const DEMO_EFFICACY_EVALUATIONS = [
  {
    training_program_id: '1',
    training_name: 'NR-12 Segurança em Máquinas',
    category: 'Segurança',
    deadline: '2026-03-15',
    status: 'Pendente',
    days_remaining: 20,
    participants_count: 45,
  },
  {
    training_program_id: '2',
    training_name: 'Gestão de Resíduos Sólidos',
    category: 'Ambiental',
    deadline: '2026-02-20',
    status: 'Atrasado',
    days_remaining: -5,
    participants_count: 30,
  },
  {
    training_program_id: '5',
    training_name: 'ISO 14001 - Auditor Interno',
    category: 'Compliance',
    deadline: '2026-01-31',
    status: 'Avaliado',
    days_remaining: -25,
    evaluation_id: 'eff-5',
    participants_count: 8,
  },
];

const DEMO_EFFICACY_DASHBOARD_METRICS = {
  total: DEMO_EFFICACY_EVALUATIONS.length,
  pending: DEMO_EFFICACY_EVALUATIONS.filter((item) => item.status === 'Pendente').length,
  evaluated: DEMO_EFFICACY_EVALUATIONS.filter((item) => item.status === 'Avaliado').length,
  overdue: DEMO_EFFICACY_EVALUATIONS.filter((item) => item.status === 'Atrasado').length,
};

const DEMO_BENEFITS = [
  { id: 'ben-1', name: 'Vale Refeição', type: 'Alimentação', description: 'Cartão alimentação diário para colaboradores', monthly_cost: 770, is_active: true, participants: 8, total_employees: 8, provider: 'VR Brasil', contract_number: 'VR-2025-001', company_id: DEMO_COMPANY_ID, created_at: '2025-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
  { id: 'ben-2', name: 'Plano de Saúde', type: 'Saúde', description: 'Plano nacional com cobertura ambulatorial e hospitalar', monthly_cost: 850, is_active: true, participants: 7, total_employees: 8, provider: 'Saúde+ Nacional', contract_number: 'PS-2024-022', company_id: DEMO_COMPANY_ID, created_at: '2024-06-01T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
  { id: 'ben-3', name: 'Vale Transporte', type: 'Transporte', description: 'Subsídio mensal para deslocamento', monthly_cost: 220, is_active: true, participants: 6, total_employees: 8, provider: 'Mobilidade SP', contract_number: 'VT-2024-119', company_id: DEMO_COMPANY_ID, created_at: '2024-06-01T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
  { id: 'ben-4', name: 'Seguro de Vida', type: 'Seguro', description: 'Cobertura de vida e invalidez', monthly_cost: 120, is_active: true, participants: 8, total_employees: 8, provider: 'Seguradora Alfa', contract_number: 'SV-2025-073', company_id: DEMO_COMPANY_ID, created_at: '2025-02-01T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
];

const DEMO_BENEFIT_STATS = {
  totalBenefitsCost: DEMO_BENEFITS.reduce((sum, benefit) => sum + benefit.monthly_cost, 0),
  benefitParticipation: 88,
  totalEnrollments: 29,
  totalEmployees: demoEmployees.length,
};

const DEMO_SAFETY_INSPECTIONS = [
  { id: 'ins-1', company_id: DEMO_COMPANY_ID, title: 'Inspeção mensal linha A', inspection_type: 'area_trabalho', area_location: 'Linha de Produção A', inspector_name: 'Roberto Oliveira', inspection_date: '2026-02-12', status: 'Concluída', result: 'Conforme', score: 94, checklist_items: [], observations: 'Uso correto de EPI em todos os postos', created_at: '2026-02-12T08:00:00Z', updated_at: '2026-02-12T09:00:00Z' },
  { id: 'ins-2', company_id: DEMO_COMPANY_ID, title: 'Inspeção de empilhadeiras', inspection_type: 'equipamentos', area_location: 'Armazém Central', inspector_name: 'Mariana Costa', inspection_date: '2026-02-19', status: 'Em Andamento', result: undefined, score: undefined, checklist_items: [], observations: 'Treinamento complementar em andamento', created_at: '2026-02-19T09:00:00Z', updated_at: '2026-02-19T10:00:00Z' },
  { id: 'ins-3', company_id: DEMO_COMPANY_ID, title: 'Inspeção brigada de emergência', inspection_type: 'ronda_seguranca', area_location: 'Bloco Administrativo', inspector_name: 'Ana Silva', inspection_date: '2026-02-25', status: 'Pendente', result: undefined, score: undefined, checklist_items: [], observations: 'Agendada para próxima semana', created_at: '2026-02-18T11:00:00Z', updated_at: '2026-02-18T11:00:00Z' },
];

const DEMO_SAFETY_INSPECTION_METRICS = {
  total: DEMO_SAFETY_INSPECTIONS.length,
  pending: DEMO_SAFETY_INSPECTIONS.filter((inspection) => inspection.status === 'Pendente').length,
  inProgress: DEMO_SAFETY_INSPECTIONS.filter((inspection) => inspection.status === 'Em Andamento').length,
  completed: DEMO_SAFETY_INSPECTIONS.filter((inspection) => inspection.status === 'Concluída').length,
  conformeRate: 100,
  thisMonth: 3,
  lastMonth: 2,
};

const DEMO_SAFETY_TRAINING_METRICS = {
  programs: [
    { programId: '1', programName: 'NR-12 Segurança em Máquinas', category: 'Segurança', totalEnrolled: 4, completed: 3, inProgress: 1, pending: 0, completionRate: 75, expired: 0, durationHours: 16 },
    { programId: '4', programName: 'Primeiros Socorros', category: 'Segurança', totalEnrolled: 3, completed: 1, inProgress: 1, pending: 1, completionRate: 33, expired: 0, durationHours: 12 },
  ],
  overallCompliance: 67,
  totalHours: 60,
  totalEmployeesTrained: 4,
  pendingTrainings: 3,
  expiredTrainings: 0,
};

const DEMO_CAREER_DEVELOPMENT_PLANS = [
  {
    id: 'cdp-1',
    company_id: DEMO_COMPANY_ID,
    employee_id: 'emp-3',
    current_position: 'Coordenadora de RH',
    target_position: 'Gerente de RH',
    start_date: '2025-06-01',
    target_date: '2026-12-15',
    status: 'Em Andamento',
    progress_percentage: 58,
    mentor_id: 'emp-5',
    goals: [{ title: 'Concluir trilha de liderança', status: 'in_progress' }],
    skills_to_develop: [{ skill_name: 'Gestão de Pessoas', current_level: 'intermediate', target_level: 'advanced' }],
    development_activities: [{ activity: 'Mentoria mensal com diretoria', frequency: 'Mensal' }],
    notes: 'Bom avanço no último trimestre',
    created_by_user_id: 'demo-user-1',
    created_at: '2025-06-01T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
    employee: { id: 'emp-3', full_name: 'Mariana Costa', employee_code: 'A003', department: 'Recursos Humanos' },
    mentor: { id: 'emp-5', full_name: 'Juliana Lima' },
  },
  {
    id: 'cdp-2',
    company_id: DEMO_COMPANY_ID,
    employee_id: 'emp-6',
    current_position: 'Engenheiro de Qualidade',
    target_position: 'Coordenador de Qualidade',
    start_date: '2025-09-10',
    target_date: '2026-11-30',
    status: 'Em Andamento',
    progress_percentage: 44,
    mentor_id: 'emp-1',
    goals: [{ title: 'Certificação Green Belt', status: 'in_progress' }],
    skills_to_develop: [{ skill_name: 'Gestão de Projetos', current_level: 'beginner', target_level: 'intermediate' }],
    development_activities: [{ activity: 'Job rotation entre áreas', frequency: 'Bimestral' }],
    notes: 'Necessita reforço em apresentação executiva',
    created_by_user_id: 'demo-user-1',
    created_at: '2025-09-10T10:00:00Z',
    updated_at: '2026-02-08T10:00:00Z',
    employee: { id: 'emp-6', full_name: 'Pedro Almeida', employee_code: 'A006', department: 'Qualidade' },
    mentor: { id: 'emp-1', full_name: 'Ana Silva' },
  },
];

const DEMO_SUCCESSION_PLANS = [
  {
    id: 'spn-1',
    company_id: DEMO_COMPANY_ID,
    position_title: 'Diretora Financeira',
    department: 'Financeiro',
    current_holder_id: 'emp-5',
    critical_level: 'Alto',
    expected_retirement_date: '2028-12-31',
    created_by_user_id: 'demo-user-1',
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
    current_holder: { id: 'emp-5', full_name: 'Juliana Lima' },
    candidates: [
      { id: 'spc-1', succession_plan_id: 'spn-1', employee_id: 'emp-3', readiness_level: '1-2 Anos', readiness_score: 72, development_needs: ['Gestão financeira avançada'], notes: 'Plano em evolução', created_at: '2025-03-10T10:00:00Z', updated_at: '2026-02-12T10:00:00Z', employee: { id: 'emp-3', full_name: 'Mariana Costa', position: 'Coordenadora de RH' } },
    ],
  },
];

const DEMO_MENTORING_RELATIONSHIPS = [
  {
    id: 'ment-1',
    company_id: DEMO_COMPANY_ID,
    mentor_id: 'emp-1',
    mentee_id: 'emp-6',
    program_name: 'Liderança Técnica',
    start_date: '2025-10-01',
    end_date: '2026-10-01',
    status: 'Ativo',
    objectives: ['Aprimorar liderança de projetos'],
    meeting_frequency: 'Mensal',
    progress_notes: 'Evolução consistente nas últimas avaliações',
    created_by_user_id: 'demo-user-1',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2026-02-12T10:00:00Z',
    mentor: { id: 'emp-1', full_name: 'Ana Silva' },
    mentee: { id: 'emp-6', full_name: 'Pedro Almeida' },
  },
];

const DEMO_INTERNAL_JOB_POSTINGS = [
  {
    id: 'job-1',
    company_id: DEMO_COMPANY_ID,
    title: 'Coordenador(a) de Sustentabilidade',
    department: 'Meio Ambiente',
    location: 'São Paulo',
    employment_type: 'CLT',
    level: 'Sênior',
    description: 'Liderar iniciativas socioambientais e reportes ESG.',
    requirements: ['Experiência com GRI', 'Gestão de projetos'],
    benefits: ['Plano de Saúde', 'PLR'],
    salary_range_min: 11000,
    salary_range_max: 15000,
    application_deadline: '2026-03-31',
    status: 'Aberto',
    created_by_user_id: 'demo-user-1',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
];

const DEMO_CAREER_STATISTICS = {
  totalEmployees: demoEmployees.filter((employee) => employee.status === 'Ativo').length,
  activeIDPs: DEMO_CAREER_DEVELOPMENT_PLANS.length,
  promotionsThisYear: 3,
  skillGapsCovered: 78,
  mentoringPairs: DEMO_MENTORING_RELATIONSHIPS.length,
  successionsPlanned: DEMO_SUCCESSION_PLANS.length,
  internalMobility: 2,
  careerSatisfaction: 4.2,
};

const DEMO_MANDATORY_PROGRAMS = DEMO_TRAINING_PROGRAMS.filter((program) => program.is_mandatory).map((program) => ({
  id: program.id,
  name: program.name,
  category: program.category,
  valid_for_months: program.valid_for_months,
}));

const DEMO_EMPLOYEE_TRAININGS_COMPLIANCE = DEMO_EMPLOYEE_TRAININGS.map((training) => ({
  employee_id: training.employee_id,
  training_program_id: training.training_program_id,
  status: training.status,
  completion_date: training.completion_date,
  expiration_date: null,
}));

const DEMO_COMPETENCY_MATRIX = [
  { id: 'comp-1', company_id: DEMO_COMPANY_ID, competency_name: 'Liderança', competency_category: 'Comportamental', description: 'Capacidade de liderar pessoas e resultados', levels: [{ level: 1, name: 'Básico', description: 'Apoia a equipe', behaviors: ['Comunica tarefas'] }], is_active: true, created_at: '2025-01-01T10:00:00Z', updated_at: '2026-01-01T10:00:00Z' },
  { id: 'comp-2', company_id: DEMO_COMPANY_ID, competency_name: 'Análise de Dados', competency_category: 'Técnica', description: 'Análise para tomada de decisão', levels: [{ level: 1, name: 'Básico', description: 'Interpreta métricas', behaviors: ['Constrói relatórios'] }], is_active: true, created_at: '2025-01-01T10:00:00Z', updated_at: '2026-01-01T10:00:00Z' },
];

const DEMO_COMPETENCY_ASSESSMENTS = [
  { id: 'assess-1', company_id: DEMO_COMPANY_ID, employee_id: 'emp-3', competency_id: 'comp-1', current_level: 2, target_level: 4, assessor_user_id: 'demo-user-1', assessment_date: '2026-02-01', development_plan: 'Mentoria quinzenal e prática em projetos', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z', competency: { competency_name: 'Liderança', competency_category: 'Comportamental' } },
  { id: 'assess-2', company_id: DEMO_COMPANY_ID, employee_id: 'emp-6', competency_id: 'comp-2', current_level: 3, target_level: 4, assessor_user_id: 'demo-user-1', assessment_date: '2026-01-22', development_plan: 'Curso avançado de BI', created_at: '2026-01-22T10:00:00Z', updated_at: '2026-01-22T10:00:00Z', competency: { competency_name: 'Análise de Dados', competency_category: 'Técnica' } },
];

const DEMO_COMPETENCY_GAPS = [
  { competency_name: 'Liderança', category: 'Comportamental', employees_assessed: 1, average_current_level: 2, average_target_level: 4, average_gap: 2, critical_gaps: 1 },
  { competency_name: 'Análise de Dados', category: 'Técnica', employees_assessed: 1, average_current_level: 3, average_target_level: 4, average_gap: 1, critical_gaps: 0 },
];

export const socialMockEntries = [
  // Employees list
  {
    queryKey: ['employees'],
    data: demoEmployees,
  },
  {
    queryKey: ['company-employees', DEMO_COMPANY_ID],
    data: demoEmployees.map(e => ({ id: e.id, full_name: e.full_name, position: e.position })),
  },
  {
    queryKey: ['company-users', DEMO_COMPANY_ID],
    data: demoEmployees.slice(0, 5).map(e => ({ id: e.id, full_name: e.full_name, role: 'viewer' })),
  },
  // Employees stats
  {
    queryKey: ['employees-stats'],
    data: DEMO_EMPLOYEE_STATS,
  },
  {
    queryKey: ['employee-stats'],
    data: DEMO_EMPLOYEE_STATS,
  },
  {
    queryKey: ['employee-departments'],
    data: DEMO_EMPLOYEE_DEPARTMENTS,
  },
  // Employees paginated (base for prefix match)
  {
    queryKey: ['employees-paginated'],
    data: {
      data: demoEmployees,
      totalCount: demoEmployees.length,
      totalPages: 1,
      currentPage: 1,
    },
  },
  // Social ESG Dashboard
  {
    queryKey: ['social-esg-dashboard', DEMO_COMPANY_ID],
    data: {
      totalEmployees: 342,
      femalePercentage: 44.7,
      turnoverRate: 8.2,
      avgTrainingHours: 42,
      safetyIncidents: 3,
      daysSinceLastIncident: 87,
      employeeSatisfaction: 78.5,
      diversityIndex: 0.62,
    },
  },
  {
    queryKey: ['social-filter-options'],
    data: DEMO_SOCIAL_FILTER_OPTIONS,
  },
  // Training programs
  {
    queryKey: ['training-programs', DEMO_COMPANY_ID],
    data: DEMO_TRAINING_PROGRAMS,
  },
  // Training programs (base key for prefix)
  {
    queryKey: ['training-programs'],
    data: DEMO_TRAINING_PROGRAMS,
  },
  // Safety incidents
  {
    queryKey: ['safety-incidents', DEMO_COMPANY_ID],
    data: [
      { id: '1', incident_type: 'Quase Acidente', description: 'Derramamento de produto químico no armazém', severity: 'Média', incident_date: '2026-01-10', location: 'Armazém', days_lost: 0, medical_treatment_required: false, status: 'Em Investigação', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
      { id: '2', incident_type: 'Acidente sem afastamento', description: 'Corte superficial na linha de produção', severity: 'Baixa', incident_date: '2025-12-05', location: 'Produção', days_lost: 0, medical_treatment_required: true, status: 'Resolvido', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2025-12-05T11:00:00Z', updated_at: '2025-12-08T09:00:00Z' },
      { id: '3', incident_type: 'Acidente com afastamento', description: 'Queda de nível em manutenção', severity: 'Alta', incident_date: '2025-11-20', location: 'Manutenção', days_lost: 6, medical_treatment_required: true, status: 'Resolvido', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2025-11-20T08:30:00Z', updated_at: '2025-12-02T14:00:00Z' },
    ],
  },
  // Safety incidents (base)
  {
    queryKey: ['safety-incidents'],
    data: [
      { id: '1', incident_type: 'Quase Acidente', description: 'Derramamento de produto químico no armazém', severity: 'Média', incident_date: '2026-01-10', location: 'Armazém', days_lost: 0, medical_treatment_required: false, status: 'Em Investigação', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
      { id: '2', incident_type: 'Acidente sem afastamento', description: 'Corte superficial na linha de produção', severity: 'Baixa', incident_date: '2025-12-05', location: 'Produção', days_lost: 0, medical_treatment_required: true, status: 'Resolvido', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2025-12-05T11:00:00Z', updated_at: '2025-12-08T09:00:00Z' },
      { id: '3', incident_type: 'Acidente com afastamento', description: 'Queda de nível em manutenção', severity: 'Alta', incident_date: '2025-11-20', location: 'Manutenção', days_lost: 6, medical_treatment_required: true, status: 'Resolvido', company_id: DEMO_COMPANY_ID, reported_by_user_id: 'demo-user-1', created_at: '2025-11-20T08:30:00Z', updated_at: '2025-12-02T14:00:00Z' },
    ],
  },
  // HR performance
  {
    queryKey: ['hr', 'performance', DEMO_COMPANY_ID],
    data: {
      averageScore: 7.8,
      evaluationsCompleted: 280,
      evaluationsPending: 62,
      topPerformers: 45,
      needsImprovement: 12,
    },
  },
  // Career development plans
  {
    queryKey: ['career-plans', DEMO_COMPANY_ID],
    data: DEMO_CAREER_DEVELOPMENT_PLANS,
  },
  // Career plans (base)
  {
    queryKey: ['career-plans'],
    data: DEMO_CAREER_DEVELOPMENT_PLANS,
  },
  {
    queryKey: ['career-development-plans'],
    data: DEMO_CAREER_DEVELOPMENT_PLANS,
  },
  {
    queryKey: ['career-statistics'],
    data: DEMO_CAREER_STATISTICS,
  },
  {
    queryKey: ['succession-plans'],
    data: DEMO_SUCCESSION_PLANS,
  },
  {
    queryKey: ['mentoring-relationships'],
    data: DEMO_MENTORING_RELATIONSHIPS,
  },
  {
    queryKey: ['internal-job-postings'],
    data: DEMO_INTERNAL_JOB_POSTINGS,
  },
  // Attendance/Ponto
  {
    queryKey: ['attendance-records', DEMO_COMPANY_ID],
    data: [
      { id: 'att-1', employee_id: 'emp-1', employee_name: 'Ana Silva', date: '2026-02-10', check_in: '08:02', check_out: '17:35', total_hours: 8.5, status: 'Normal', company_id: DEMO_COMPANY_ID },
      { id: 'att-2', employee_id: 'emp-2', employee_name: 'Carlos Santos', date: '2026-02-10', check_in: '07:55', check_out: '17:10', total_hours: 8.25, status: 'Normal', company_id: DEMO_COMPANY_ID },
      { id: 'att-3', employee_id: 'emp-3', employee_name: 'Mariana Costa', date: '2026-02-10', check_in: '08:30', check_out: '18:00', total_hours: 8.5, status: 'Normal', company_id: DEMO_COMPANY_ID },
      { id: 'att-4', employee_id: 'emp-4', employee_name: 'Roberto Oliveira', date: '2026-02-10', check_in: '06:00', check_out: '14:30', total_hours: 8.5, status: 'Normal', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Attendance (base)
  {
    queryKey: ['attendance-records'],
    data: [
      { id: 'att-1', employee_id: 'emp-1', employee_name: 'Ana Silva', date: '2026-02-10', check_in: '08:02', check_out: '17:35', total_hours: 8.5, status: 'Normal', company_id: DEMO_COMPANY_ID },
      { id: 'att-2', employee_id: 'emp-2', employee_name: 'Carlos Santos', date: '2026-02-10', check_in: '07:55', check_out: '17:10', total_hours: 8.25, status: 'Normal', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Benefits
  {
    queryKey: ['benefits', DEMO_COMPANY_ID],
    data: DEMO_BENEFITS,
  },
  // Benefits (base)
  {
    queryKey: ['benefits'],
    data: DEMO_BENEFITS,
  },
  // Benefit stats
  {
    queryKey: ['benefit-stats'],
    data: DEMO_BENEFIT_STATS,
  },
  // Training stats
  {
    queryKey: ['training-stats'],
    data: {
      totalPrograms: 5,
      activePrograms: 3,
      totalEnrolled: 148,
      completionRate: 76.4,
      avgHoursPerEmployee: 42,
      investmentTotal: 320000,
    },
  },
  // Training courses
  {
    queryKey: ['training-courses'],
    data: [
      { id: 'tc-1', title: 'NR-12 Segurança em Máquinas', category: 'SST', status: 'published', total_hours: 16, enrolled_count: 45, completion_rate: 84 },
      { id: 'tc-2', title: 'Gestão de Resíduos Sólidos', category: 'Ambiental', status: 'published', total_hours: 8, enrolled_count: 30, completion_rate: 93 },
      { id: 'tc-3', title: 'Liderança e Gestão', category: 'Desenvolvimento', status: 'published', total_hours: 24, enrolled_count: 15, completion_rate: 67 },
    ],
  },
  // Safety stats
  {
    queryKey: ['safety-stats'],
    data: {
      totalIncidents: 3,
      daysSinceLastIncident: 87,
      frequencyRate: 1.8,
      severityRate: 0.5,
      nearMisses: 2,
      lostTimeDays: 0,
    },
  },
  // Performance evaluations
  {
    queryKey: ['performance-evaluations'],
    data: [
      { id: 'pe-1', employee_id: 'emp-1', employee_name: 'Ana Silva', score: 9.2, period: '2025-H2', status: 'Concluída' },
      { id: 'pe-2', employee_id: 'emp-2', employee_name: 'Carlos Santos', score: 8.5, period: '2025-H2', status: 'Concluída' },
      { id: 'pe-3', employee_id: 'emp-6', employee_name: 'Pedro Almeida', score: 8.8, period: '2025-H2', status: 'Concluída' },
    ],
  },
  // Employee documents
  {
    queryKey: ['employee-documents'],
    data: [
      { id: 'ed-1', name: 'Contrato de Trabalho', type: 'Contrato', employee_id: 'emp-1', status: 'Válido' },
      { id: 'ed-2', name: 'ASO - Admissional', type: 'Saúde', employee_id: 'emp-1', status: 'Válido' },
    ],
  },
  // Course enrollments
  {
    queryKey: ['course-enrollments'],
    data: [
      { id: 'ce-1', course_id: 'c-1', employee_id: 'emp-1', employee_name: 'Ana Martins', progress: 100, status: 'Concluído', enrolled_at: '2026-01-05' },
      { id: 'ce-2', course_id: 'c-2', employee_id: 'emp-3', employee_name: 'Carlos Lima', progress: 78, status: 'Em Andamento', enrolled_at: '2026-01-18' },
      { id: 'ce-3', course_id: 'c-3', employee_id: 'emp-5', employee_name: 'Juliana Pereira', progress: 42, status: 'Em Andamento', enrolled_at: '2026-02-02' },
    ],
  },
  // Efficacy evaluation dashboard
  {
    queryKey: ['my-efficacy-evaluations'],
    data: DEMO_EFFICACY_EVALUATIONS,
  },
  {
    queryKey: ['efficacy-dashboard-metrics'],
    data: DEMO_EFFICACY_DASHBOARD_METRICS,
  },
  // Training and social dashboards
  {
    queryKey: ['training-categories'],
    data: DEMO_TRAINING_CATEGORIES,
  },
  {
    queryKey: ['employee-trainings'],
    data: DEMO_EMPLOYEE_TRAININGS,
  },
  {
    queryKey: ['employees-for-training-modal-2'],
    data: DEMO_ACTIVE_EMPLOYEES_FOR_TRAINING,
  },
  {
    queryKey: ['employees-for-reschedule'],
    data: DEMO_ACTIVE_EMPLOYEES_FOR_TRAINING,
  },
  {
    queryKey: ['training-participants'],
    data: DEMO_TRAINING_PARTICIPANTS,
  },
  {
    queryKey: ['training-export-preview'],
    data: DEMO_TRAINING_EXPORT_PREVIEW,
  },
  {
    queryKey: ['training-metrics'],
    data: DEMO_TRAINING_METRICS,
  },
  {
    queryKey: ['safety-metrics'],
    data: DEMO_SAFETY_METRICS,
  },
  {
    queryKey: ['safety-inspections'],
    data: DEMO_SAFETY_INSPECTIONS,
  },
  {
    queryKey: ['safety-inspection-metrics'],
    data: DEMO_SAFETY_INSPECTION_METRICS,
  },
  {
    queryKey: ['safety-training-metrics', DEMO_COMPANY_ID],
    data: DEMO_SAFETY_TRAINING_METRICS,
  },
  {
    queryKey: ['safety-training-metrics'],
    data: DEMO_SAFETY_TRAINING_METRICS,
  },
  {
    queryKey: ['employees-active'],
    data: demoEmployees.filter((employee) => employee.status === 'Ativo').map((employee) => ({
      id: employee.id,
      full_name: employee.full_name,
      employee_code: employee.employee_code,
      department: employee.department,
    })),
  },
  {
    queryKey: ['mandatory-programs'],
    data: DEMO_MANDATORY_PROGRAMS,
  },
  {
    queryKey: ['employee-trainings-compliance'],
    data: DEMO_EMPLOYEE_TRAININGS_COMPLIANCE,
  },
  {
    queryKey: ['competency-matrix'],
    data: DEMO_COMPETENCY_MATRIX,
  },
  {
    queryKey: ['competency-assessments'],
    data: DEMO_COMPETENCY_ASSESSMENTS,
  },
  {
    queryKey: ['competency-gaps'],
    data: DEMO_COMPETENCY_GAPS,
  },
  {
    queryKey: ['social-projects'],
    data: DEMO_SOCIAL_PROJECTS,
  },
  {
    queryKey: ['social-metrics'],
    data: DEMO_SOCIAL_METRICS,
  },
  {
    queryKey: ['filtered-training-metrics'],
    data: DEMO_FILTERED_TRAINING_METRICS,
  },
];
