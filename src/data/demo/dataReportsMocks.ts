/**
 * Mock data for Data & Reports modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const dataReportsMockEntries = [
  // Data collection tasks
  {
    queryKey: ['data-collection-tasks', DEMO_COMPANY_ID],
    data: [
      { id: 'dc-1', name: 'Coleta Mensal de Consumo de Água', description: 'Registrar consumo de água de todas as unidades', status: 'Pendente', task_type: 'Mensal', due_date: '2026-02-28', assigned_to: 'Carlos Santos', company_id: DEMO_COMPANY_ID },
      { id: 'dc-2', name: 'Inventário de Resíduos Q1', description: 'Consolidar dados de resíduos do trimestre', status: 'Em Andamento', task_type: 'Trimestral', due_date: '2026-03-31', assigned_to: 'Carlos Santos', company_id: DEMO_COMPANY_ID },
      { id: 'dc-3', name: 'Dados de Emissão Fev/26', description: 'Registrar dados de combustíveis e energia', status: 'Pendente', task_type: 'Mensal', due_date: '2026-03-10', assigned_to: 'Ana Silva', company_id: DEMO_COMPANY_ID },
      { id: 'dc-4', name: 'Indicadores Sociais 2025', description: 'Consolidar dados de RH para relatório anual', status: 'Concluída', task_type: 'Anual', due_date: '2026-01-31', assigned_to: 'Mariana Costa', company_id: DEMO_COMPANY_ID },
      { id: 'dc-5', name: 'Dados Financeiros ESG', description: 'Classificar despesas por categoria ESG', status: 'Em Atraso', task_type: 'Mensal', due_date: '2026-02-05', assigned_to: 'Juliana Lima', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Documents
  {
    queryKey: ['documents', DEMO_COMPANY_ID],
    data: [
      { id: 'doc-1', file_name: 'Relatório de Sustentabilidade 2025.pdf', file_type: 'application/pdf', file_size: 2500000, upload_date: '2026-01-15T10:00:00Z', tags: ['relatório', 'sustentabilidade', '2025'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-2', file_name: 'Inventário GEE 2025.xlsx', file_type: 'application/xlsx', file_size: 450000, upload_date: '2026-01-20T14:30:00Z', tags: ['emissões', 'GEE', 'inventário'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-3', file_name: 'Licença de Operação - LO-2024-001.pdf', file_type: 'application/pdf', file_size: 800000, upload_date: '2024-01-15T09:00:00Z', tags: ['licença', 'operação', 'ambiental'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-4', file_name: 'Manual SGQ v6.0.pdf', file_type: 'application/pdf', file_size: 3200000, upload_date: '2025-12-01T16:00:00Z', tags: ['qualidade', 'manual', 'SGQ'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-5', file_name: 'Política Ambiental 2026.pdf', file_type: 'application/pdf', file_size: 320000, upload_date: '2026-01-05T08:00:00Z', tags: ['política', 'ambiental'], company_id: DEMO_COMPANY_ID },
    ],
  },
  // Document extractions
  {
    queryKey: ['documents', 'extractions', DEMO_COMPANY_ID],
    data: [],
  },
  // Integrated reports
  {
    queryKey: ['integrated-reports', DEMO_COMPANY_ID],
    data: [
      { id: 'ir-1', title: 'Relatório de Sustentabilidade 2025', framework: 'GRI Standards', status: 'Publicado', completion_percentage: 100, year: 2025, company_id: DEMO_COMPANY_ID },
      { id: 'ir-2', title: 'Relatório ESG Q3 2025', framework: 'SASB', status: 'Em Elaboração', completion_percentage: 45, year: 2025, company_id: DEMO_COMPANY_ID },
      { id: 'ir-3', title: 'Inventário GEE 2025', framework: 'GHG Protocol', status: 'Em Revisão', completion_percentage: 85, year: 2025, company_id: DEMO_COMPANY_ID },
    ],
  },
  // SDG Dashboard
  {
    queryKey: ['sdg-contributions', DEMO_COMPANY_ID],
    data: [
      { sdg: 6, name: 'Água Potável e Saneamento', contribution: 72, actions: 5 },
      { sdg: 7, name: 'Energia Limpa e Acessível', contribution: 45, actions: 3 },
      { sdg: 8, name: 'Trabalho Decente', contribution: 85, actions: 8 },
      { sdg: 12, name: 'Consumo e Produção Responsáveis', contribution: 68, actions: 6 },
      { sdg: 13, name: 'Ação Contra a Mudança Global do Clima', contribution: 58, actions: 7 },
      { sdg: 15, name: 'Vida Terrestre', contribution: 42, actions: 3 },
    ],
  },
  // Recommended indicators
  {
    queryKey: ['recommended-indicators', DEMO_COMPANY_ID],
    data: [
      { id: 'ri-1', code: 'GRI 305-1', name: 'Emissões Diretas (Escopo 1)', value: 485.3, unit: 'tCO2e', benchmark: 520, status: 'Abaixo da Média' },
      { id: 'ri-2', code: 'GRI 302-1', name: 'Consumo de Energia', value: 4520, unit: 'MWh', benchmark: 4800, status: 'Abaixo da Média' },
      { id: 'ri-3', code: 'GRI 303-3', name: 'Captação de Água', value: 12450, unit: 'm³', benchmark: 15000, status: 'Abaixo da Média' },
      { id: 'ri-4', code: 'GRI 403-9', name: 'Acidentes de Trabalho', value: 3, unit: 'incidentes', benchmark: 5, status: 'Abaixo da Média' },
      { id: 'ri-5', code: 'GRI 404-1', name: 'Horas de Treinamento', value: 42, unit: 'h/func', benchmark: 40, status: 'Acima da Média' },
    ],
  },
  // Assets
  {
    queryKey: ['assets', DEMO_COMPANY_ID],
    data: [
      { id: 'a-1', name: 'Linha de Produção A', asset_type: 'Equipamento', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2018, company_id: DEMO_COMPANY_ID },
      { id: 'a-2', name: 'Caldeira Industrial', asset_type: 'Equipamento', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2020, company_id: DEMO_COMPANY_ID },
      { id: 'a-3', name: 'Sistema de Tratamento de Efluentes', asset_type: 'Infraestrutura', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2019, company_id: DEMO_COMPANY_ID },
      { id: 'a-4', name: 'Frota de Caminhões (5 veículos)', asset_type: 'Veículo', location: 'CD Rio', operational_status: 'Operacional', installation_year: 2022, company_id: DEMO_COMPANY_ID },
    ],
  },
];
