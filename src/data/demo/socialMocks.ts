/**
 * Mock data for Social ESG modules (employees, training, safety, career)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const demoEmployees = [
  { id: 'emp-1', full_name: 'Ana Silva', position: 'Gerente de Operações', department: 'Operações', status: 'Ativo', gender: 'Feminino', hire_date: '2020-03-15', email: 'ana.silva@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-2', full_name: 'Carlos Santos', position: 'Analista Ambiental Sr', department: 'Meio Ambiente', status: 'Ativo', gender: 'Masculino', hire_date: '2019-06-01', email: 'carlos.santos@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-3', full_name: 'Mariana Costa', position: 'Coordenadora de RH', department: 'Recursos Humanos', status: 'Ativo', gender: 'Feminino', hire_date: '2021-01-10', email: 'mariana.costa@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-4', full_name: 'Roberto Oliveira', position: 'Técnico de Segurança', department: 'SST', status: 'Ativo', gender: 'Masculino', hire_date: '2018-08-20', email: 'roberto.oliveira@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-5', full_name: 'Juliana Lima', position: 'Diretora Financeira', department: 'Financeiro', status: 'Ativo', gender: 'Feminino', hire_date: '2017-02-01', email: 'juliana.lima@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-6', full_name: 'Pedro Almeida', position: 'Engenheiro de Qualidade', department: 'Qualidade', status: 'Ativo', gender: 'Masculino', hire_date: '2022-04-15', email: 'pedro.almeida@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-7', full_name: 'Fernanda Rocha', position: 'Analista de Compliance', department: 'Jurídico', status: 'Ativo', gender: 'Feminino', hire_date: '2023-01-05', email: 'fernanda.rocha@demo.com', company_id: DEMO_COMPANY_ID },
  { id: 'emp-8', full_name: 'Lucas Mendes', position: 'Supervisor de Produção', department: 'Produção', status: 'Ativo', gender: 'Masculino', hire_date: '2019-11-01', email: 'lucas.mendes@demo.com', company_id: DEMO_COMPANY_ID },
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
  // Training programs
  {
    queryKey: ['training-programs', DEMO_COMPANY_ID],
    data: [
      { id: '1', title: 'NR-12 Segurança em Máquinas', category: 'SST', status: 'Ativo', total_hours: 16, enrolled: 45, completed: 38, instructor: 'João Pereira', start_date: '2026-01-15', company_id: DEMO_COMPANY_ID },
      { id: '2', title: 'Gestão de Resíduos Sólidos', category: 'Ambiental', status: 'Ativo', total_hours: 8, enrolled: 30, completed: 28, instructor: 'Maria Santos', start_date: '2026-01-20', company_id: DEMO_COMPANY_ID },
      { id: '3', title: 'Liderança e Gestão de Equipes', category: 'Desenvolvimento', status: 'Ativo', total_hours: 24, enrolled: 15, completed: 10, instructor: 'Ricardo Lima', start_date: '2026-02-01', company_id: DEMO_COMPANY_ID },
      { id: '4', title: 'Primeiros Socorros', category: 'SST', status: 'Planejado', total_hours: 12, enrolled: 50, completed: 0, instructor: 'Dr. Ana Souza', start_date: '2026-03-15', company_id: DEMO_COMPANY_ID },
      { id: '5', title: 'ISO 14001 - Auditor Interno', category: 'Qualidade', status: 'Concluído', total_hours: 40, enrolled: 8, completed: 8, instructor: 'Paulo Alves', start_date: '2025-11-01', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Safety incidents
  {
    queryKey: ['safety-incidents', DEMO_COMPANY_ID],
    data: [
      { id: '1', incident_type: 'Quase Acidente', description: 'Derramamento de produto químico no armazém', severity: 'Moderada', incident_date: '2026-01-10', department: 'Armazém', status: 'Investigado', company_id: DEMO_COMPANY_ID },
      { id: '2', incident_type: 'Acidente sem afastamento', description: 'Corte superficial na linha de produção', severity: 'Leve', incident_date: '2025-12-05', department: 'Produção', status: 'Concluído', company_id: DEMO_COMPANY_ID },
      { id: '3', incident_type: 'Quase Acidente', description: 'Falha em equipamento de elevação', severity: 'Alta', incident_date: '2025-11-20', department: 'Manutenção', status: 'Investigado', company_id: DEMO_COMPANY_ID },
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
    data: [
      { id: '1', employee_id: 'emp-1', employee_name: 'Ana Silva', goals: [{ title: 'MBA em Gestão', status: 'in_progress' }], skills_to_develop: [{ skill_name: 'Liderança Estratégica', current_level: 'advanced', target_level: 'expert' }], status: 'Ativo', created_at: '2025-06-01' },
      { id: '2', employee_id: 'emp-2', employee_name: 'Carlos Santos', goals: [{ title: 'Certificação ISO 14001', status: 'completed' }], skills_to_develop: [{ skill_name: 'Análise de Dados', current_level: 'intermediate', target_level: 'advanced' }], status: 'Ativo', created_at: '2025-03-15' },
      { id: '3', employee_id: 'emp-6', employee_name: 'Pedro Almeida', goals: [{ title: 'Especialização em Six Sigma', status: 'in_progress' }], skills_to_develop: [{ skill_name: 'Gestão de Projetos', current_level: 'beginner', target_level: 'intermediate' }], status: 'Ativo', created_at: '2025-09-01' },
    ],
  },
  // Attendance/Ponto
  {
    queryKey: ['attendance-records', DEMO_COMPANY_ID],
    data: [],
  },
  // Benefits
  {
    queryKey: ['benefits', DEMO_COMPANY_ID],
    data: [],
  },
];
