/**
 * Mock data for Environmental modules (emissions, water, energy, waste, carbon)
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const monitoringData = months.map((m, i) => ({
  month: m,
  water: 950 + Math.round(Math.sin(i * 0.5) * 200),
  energy: 380 + Math.round(Math.cos(i * 0.4) * 60),
  emissions: 105 - i * 2 + Math.round(Math.sin(i) * 10),
  waste: 45 + Math.round(Math.sin(i * 0.7) * 12),
}));

export const environmentalMockEntries = [
  // Emission sources
  {
    queryKey: ['emission-sources', DEMO_COMPANY_ID],
    data: [
      { id: '1', source_name: 'Frota de Veículos', scope: 1, category: 'Combustão Móvel', description: 'Emissões da frota própria', status: 'Ativo', company_id: DEMO_COMPANY_ID, created_at: '2025-01-01', updated_at: '2026-01-15' },
      { id: '2', source_name: 'Caldeira Industrial', scope: 1, category: 'Combustão Estacionária', description: 'Caldeira a gás natural', status: 'Ativo', company_id: DEMO_COMPANY_ID, created_at: '2025-01-01', updated_at: '2026-01-15' },
      { id: '3', source_name: 'Energia Elétrica', scope: 2, category: 'Eletricidade Comprada', description: 'Consumo da rede elétrica', status: 'Ativo', company_id: DEMO_COMPANY_ID, created_at: '2025-01-01', updated_at: '2026-01-15' },
      { id: '4', source_name: 'Transporte de Funcionários', scope: 3, category: 'Deslocamento', description: 'Transporte casa-trabalho', status: 'Ativo', company_id: DEMO_COMPANY_ID, created_at: '2025-01-01', updated_at: '2026-01-15' },
      { id: '5', source_name: 'Viagens Aéreas', scope: 3, category: 'Viagens a Negócio', description: 'Deslocamentos aéreos corporativos', status: 'Ativo', company_id: DEMO_COMPANY_ID, created_at: '2025-01-01', updated_at: '2026-01-15' },
    ],
  },
  // Emission sources (base)
  {
    queryKey: ['emission-sources'],
    data: [
      { id: '1', source_name: 'Frota de Veículos', scope: 1, category: 'Combustão Móvel', status: 'Ativo' },
      { id: '2', source_name: 'Caldeira Industrial', scope: 1, category: 'Combustão Estacionária', status: 'Ativo' },
      { id: '3', source_name: 'Energia Elétrica', scope: 2, category: 'Eletricidade Comprada', status: 'Ativo' },
    ],
  },
  // GHG Dashboard
  {
    queryKey: ['emissions', 'dashboard', DEMO_COMPANY_ID],
    data: {
      totalEmissions: 1247.5,
      scope1: 485.3,
      scope2: 312.8,
      scope3: 449.4,
      trend: -8.3,
      byCategory: [
        { category: 'Combustão Estacionária', value: 285.3, scope: 1 },
        { category: 'Combustão Móvel', value: 200.0, scope: 1 },
        { category: 'Eletricidade', value: 312.8, scope: 2 },
        { category: 'Transporte', value: 249.4, scope: 3 },
        { category: 'Viagens', value: 200.0, scope: 3 },
      ],
      monthly: monitoringData.map(d => ({ month: d.month, value: d.emissions })),
    },
  },
  // Emissions monitoring (for year-based queries)
  {
    queryKey: ['emissions-monitoring'],
    data: {
      totalEmissions: 1247.5,
      scope1: 485.3,
      scope2: 312.8,
      scope3: 449.4,
      trend: -8.3,
      monthly: monitoringData.map(d => ({ month: d.month, value: d.emissions })),
    },
  },
  // Inventory summary
  {
    queryKey: ['inventory-summary'],
    data: {
      year: 2025,
      totalEmissions: 1247.5,
      scope1: 485.3,
      scope2: 312.8,
      scope3: 449.4,
      biogenicEmissions: 45.2,
      removals: 150.0,
      netEmissions: 1097.5,
      methodology: 'GHG Protocol',
      status: 'Em Revisão',
    },
  },
  // Monitoring ESG
  {
    queryKey: ['monitoring-esg', DEMO_COMPANY_ID],
    data: { monthly: monitoringData },
  },
  {
    queryKey: ['monitoring-water', DEMO_COMPANY_ID],
    data: {
      records: monitoringData.map((d, i) => ({
        id: `w-${i}`, month: d.month, consumption: d.water, unit: 'm³', source: 'Rede pública',
        target: 1000, year: 2026, company_id: DEMO_COMPANY_ID,
      })),
      total: monitoringData.reduce((s, d) => s + d.water, 0),
      average: Math.round(monitoringData.reduce((s, d) => s + d.water, 0) / 12),
      trend: -5.2,
    },
  },
  // Monitoring water (base)
  {
    queryKey: ['monitoring-water'],
    data: {
      total: monitoringData.reduce((s, d) => s + d.water, 0),
      average: Math.round(monitoringData.reduce((s, d) => s + d.water, 0) / 12),
      trend: -5.2,
    },
  },
  {
    queryKey: ['monitoring-energy', DEMO_COMPANY_ID],
    data: {
      records: monitoringData.map((d, i) => ({
        id: `e-${i}`, month: d.month, consumption: d.energy, unit: 'MWh', source: 'Rede elétrica',
        target: 400, year: 2026, company_id: DEMO_COMPANY_ID,
      })),
      total: monitoringData.reduce((s, d) => s + d.energy, 0),
      average: Math.round(monitoringData.reduce((s, d) => s + d.energy, 0) / 12),
      trend: -3.8,
    },
  },
  // Monitoring energy (base)
  {
    queryKey: ['monitoring-energy'],
    data: {
      total: monitoringData.reduce((s, d) => s + d.energy, 0),
      trend: -3.8,
    },
  },
  {
    queryKey: ['monitoring-emissions-data', DEMO_COMPANY_ID],
    data: {
      records: monitoringData.map((d, i) => ({
        id: `em-${i}`, month: d.month, value: d.emissions, unit: 'tCO2e',
        target: 100, year: 2026, company_id: DEMO_COMPANY_ID,
      })),
      total: monitoringData.reduce((s, d) => s + d.emissions, 0),
      trend: -8.3,
    },
  },
  {
    queryKey: ['monitoring-waste-data', DEMO_COMPANY_ID],
    data: {
      records: monitoringData.map((d, i) => ({
        id: `wr-${i}`, month: d.month, quantity: d.waste, unit: 'ton',
        recycled_percentage: 65 + i * 1.5, year: 2026, company_id: DEMO_COMPANY_ID,
      })),
      total: monitoringData.reduce((s, d) => s + d.waste, 0),
      recyclingRate: 72.5,
      trend: -4.1,
    },
  },
  // Waste logs
  {
    queryKey: ['waste', DEMO_COMPANY_ID],
    data: [
      { id: '1', waste_type: 'Classe I - Perigoso', quantity: 12.5, unit: 'ton', destination: 'Incineração', transporter: 'EcoTransp Ltda', log_date: '2026-01-15', status: 'Destinado', company_id: DEMO_COMPANY_ID },
      { id: '2', waste_type: 'Classe IIA - Não Perigoso', quantity: 45.2, unit: 'ton', destination: 'Aterro Sanitário', transporter: 'Verde Ambiental', log_date: '2026-01-20', status: 'Destinado', company_id: DEMO_COMPANY_ID },
      { id: '3', waste_type: 'Reciclável', quantity: 28.8, unit: 'ton', destination: 'Cooperativa de Reciclagem', transporter: 'EcoTransp Ltda', log_date: '2026-01-25', status: 'Destinado', company_id: DEMO_COMPANY_ID },
      { id: '4', waste_type: 'Orgânico', quantity: 8.3, unit: 'ton', destination: 'Compostagem', transporter: 'BioSol Ltda', log_date: '2026-02-01', status: 'Coletado', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Waste (base)
  {
    queryKey: ['waste'],
    data: [
      { id: '1', waste_type: 'Classe I - Perigoso', quantity: 12.5, status: 'Destinado' },
      { id: '2', waste_type: 'Classe IIA - Não Perigoso', quantity: 45.2, status: 'Destinado' },
    ],
  },
  // Carbon projects
  {
    queryKey: ['conservation-activities', DEMO_COMPANY_ID],
    data: [
      { id: '1', activity_name: 'Reflorestamento Área Norte', activity_type: 'Reflorestamento', area_size: 50, area_unit: 'ha', status: 'Em Andamento', investment_amount: 250000, carbon_impact_estimate: 150, start_date: '2025-03-01', company_id: DEMO_COMPANY_ID },
      { id: '2', activity_name: 'Energia Solar Unidade 2', activity_type: 'Energia Renovável', area_size: 2, area_unit: 'ha', status: 'Em Andamento', investment_amount: 180000, carbon_impact_estimate: 85, start_date: '2025-06-01', company_id: DEMO_COMPANY_ID },
      { id: '3', activity_name: 'Proteção Nascentes', activity_type: 'Conservação', area_size: 15, area_unit: 'ha', status: 'Planejada', investment_amount: 75000, carbon_impact_estimate: 35, start_date: '2026-04-01', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Conservation activities (base)
  {
    queryKey: ['conservation-activities'],
    data: [
      { id: '1', activity_name: 'Reflorestamento Área Norte', activity_type: 'Reflorestamento', status: 'Em Andamento' },
    ],
  },
  // Licenses
  {
    queryKey: ['licenses', DEMO_COMPANY_ID],
    data: [
      { id: '1', license_name: 'Licença de Operação', license_number: 'LO-2024-001', license_type: 'Operação', status: 'Ativa', issue_date: '2024-01-15', expiry_date: '2027-01-15', issuing_body: 'IBAMA', company_id: DEMO_COMPANY_ID },
      { id: '2', license_name: 'Outorga de Uso de Água', license_number: 'OUT-2023-045', license_type: 'Recursos Hídricos', status: 'Ativa', issue_date: '2023-06-01', expiry_date: '2026-06-01', issuing_body: 'ANA', company_id: DEMO_COMPANY_ID },
      { id: '3', license_name: 'Licença de Instalação', license_number: 'LI-2025-012', license_type: 'Instalação', status: 'Em Análise', issue_date: '2025-09-01', expiry_date: '2028-09-01', issuing_body: 'CETESB', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Licenses (base)
  {
    queryKey: ['licenses'],
    data: [
      { id: '1', license_name: 'Licença de Operação', license_number: 'LO-2024-001', status: 'Ativa' },
      { id: '2', license_name: 'Outorga de Uso de Água', license_number: 'OUT-2023-045', status: 'Ativa' },
    ],
  },
  // Emission factors
  {
    queryKey: ['emissions', 'factors'],
    data: [
      { id: '1', name: 'Diesel (B10)', category: 'Combustíveis', co2_factor: 2.603, ch4_factor: 0.0001, n2o_factor: 0.0001, unit: 'kgCO2e/L', source: 'GHG Protocol Brasil' },
      { id: '2', name: 'Gasolina (E27)', category: 'Combustíveis', co2_factor: 2.212, ch4_factor: 0.0001, n2o_factor: 0.0001, unit: 'kgCO2e/L', source: 'GHG Protocol Brasil' },
      { id: '3', name: 'Gás Natural', category: 'Combustíveis', co2_factor: 2.141, ch4_factor: 0.0001, n2o_factor: 0.0001, unit: 'kgCO2e/m³', source: 'GHG Protocol Brasil' },
      { id: '4', name: 'Eletricidade - SIN', category: 'Energia', co2_factor: 0.0617, ch4_factor: 0, n2o_factor: 0, unit: 'tCO2e/MWh', source: 'MCTI' },
    ],
  },
  // Metas de sustentabilidade
  {
    queryKey: ['sustainability-goals', DEMO_COMPANY_ID],
    data: [
      { id: '1', goal_name: 'Redução de Emissões GEE', target_value: 15, current_value: 8.3, unit: '%', deadline: '2026-12-31', status: 'Em Andamento' },
      { id: '2', goal_name: 'Redução Consumo de Água', target_value: 10, current_value: 6.2, unit: '%', deadline: '2026-12-31', status: 'Em Andamento' },
      { id: '3', goal_name: 'Taxa de Reciclagem', target_value: 80, current_value: 72.5, unit: '%', deadline: '2026-12-31', status: 'Em Andamento' },
      { id: '4', goal_name: 'Energia Renovável', target_value: 30, current_value: 18.5, unit: '%', deadline: '2027-06-30', status: 'Em Andamento' },
      { id: '5', goal_name: 'Neutralidade de Carbono', target_value: 100, current_value: 25, unit: '%', deadline: '2030-12-31', status: 'Planejada' },
    ],
  },
  // Sustainability goals (base)
  {
    queryKey: ['sustainability-goals'],
    data: [
      { id: '1', goal_name: 'Redução de Emissões GEE', target_value: 15, current_value: 8.3, status: 'Em Andamento' },
    ],
  },
  // Activity data
  {
    queryKey: ['activity-data'],
    data: [],
  },
  // Water monitoring
  {
    queryKey: ['water-monitoring'],
    data: {
      total: monitoringData.reduce((s, d) => s + d.water, 0),
      trend: -5.2,
    },
  },
  // Energy monitoring
  {
    queryKey: ['energy-monitoring'],
    data: {
      total: monitoringData.reduce((s, d) => s + d.energy, 0),
      trend: -3.8,
    },
  },
];
