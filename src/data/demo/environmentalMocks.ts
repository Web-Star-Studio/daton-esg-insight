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

const DEMO_EMISSIONS_DATA = monitoringData.flatMap((dataPoint, index) => {
  const monthStart = new Date(2025, index, 1).toISOString();
  const monthEnd = new Date(2025, index + 1, 0).toISOString();
  const calculationDate = new Date(2025, index, 15).toISOString();

  return [
    {
      id: `demo-emission-${index + 1}-s1`,
      total_co2e: Number((dataPoint.emissions * 0.39).toFixed(2)),
      calculation_date: calculationDate,
      activity_data: {
        period_start_date: monthStart,
        period_end_date: monthEnd,
        emission_sources: {
          scope: 1,
          category: 'Combustão Estacionária',
          name: 'Caldeira Industrial',
        },
      },
    },
    {
      id: `demo-emission-${index + 1}-s2`,
      total_co2e: Number((dataPoint.emissions * 0.26).toFixed(2)),
      calculation_date: calculationDate,
      activity_data: {
        period_start_date: monthStart,
        period_end_date: monthEnd,
        emission_sources: {
          scope: 2,
          category: 'Eletricidade Comprada',
          name: 'Energia Elétrica',
        },
      },
    },
    {
      id: `demo-emission-${index + 1}-s3`,
      total_co2e: Number((dataPoint.emissions * 0.35).toFixed(2)),
      calculation_date: calculationDate,
      activity_data: {
        period_start_date: monthStart,
        period_end_date: monthEnd,
        emission_sources: {
          scope: 3,
          category: 'Transporte',
          name: 'Frota Terceirizada',
        },
      },
    },
  ];
});

const DEMO_ASSETS_HIERARCHY = [
  {
    id: 'asset-root-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Unidade Industrial SP',
    asset_type: 'Unidade Industrial',
    location: 'São Paulo - SP',
    description: 'Principal unidade fabril com linhas de produção e utilidades.',
    parent_asset_id: null,
    operational_status: 'Ativo',
    pollution_potential: 'Médio',
    productive_capacity: 4200,
    capacity_unit: 'ton/mês',
    installation_year: 2019,
    monitoring_frequency: 'Mensal',
    monitoring_responsible: 'Equipe de Meio Ambiente',
    critical_parameters: ['NOx', 'Material Particulado', 'CO2'],
    created_at: '2024-01-02T08:00:00Z',
    updated_at: '2026-02-12T11:20:00Z',
    children: [
      {
        id: 'asset-boiler-1',
        company_id: DEMO_COMPANY_ID,
        name: 'Caldeira 01',
        asset_type: 'Fonte Fixa de Combustão',
        location: 'Bloco A',
        parent_asset_id: 'asset-root-1',
        operational_status: 'Ativo',
        pollution_potential: 'Alto',
        created_at: '2024-02-10T08:00:00Z',
        updated_at: '2026-02-12T11:20:00Z',
        children: [],
      },
      {
        id: 'asset-stack-1',
        company_id: DEMO_COMPANY_ID,
        name: 'Chaminé Norte',
        asset_type: 'Chaminé/Stack',
        location: 'Bloco A',
        parent_asset_id: 'asset-root-1',
        operational_status: 'Ativo',
        pollution_potential: 'Médio',
        created_at: '2024-02-10T08:00:00Z',
        updated_at: '2026-02-12T11:20:00Z',
        children: [],
      },
    ],
  },
  {
    id: 'asset-root-2',
    company_id: DEMO_COMPANY_ID,
    name: 'Centro de Distribuição RJ',
    asset_type: 'Infraestrutura Auxiliar',
    location: 'Rio de Janeiro - RJ',
    description: 'Centro logístico para distribuição nacional.',
    parent_asset_id: null,
    operational_status: 'Ativo',
    pollution_potential: 'Baixo',
    productive_capacity: 1800,
    capacity_unit: 'pallets/dia',
    installation_year: 2021,
    monitoring_frequency: 'Trimestral',
    monitoring_responsible: 'Time de Operações',
    critical_parameters: ['Consumo de Energia', 'Ruído'],
    created_at: '2024-03-15T08:00:00Z',
    updated_at: '2026-02-11T10:00:00Z',
    children: [
      {
        id: 'asset-vehicle-1',
        company_id: DEMO_COMPANY_ID,
        name: 'Caminhão Baú 14T',
        asset_type: 'Fonte Móvel',
        location: 'Pátio RJ',
        parent_asset_id: 'asset-root-2',
        operational_status: 'Ativo',
        pollution_potential: 'Médio',
        created_at: '2024-04-01T08:00:00Z',
        updated_at: '2026-02-11T10:00:00Z',
        children: [],
      },
    ],
  },
];

const DEMO_ASSET_DETAILS_BY_ID: Record<string, any> = {
  'asset-root-1': {
    id: 'asset-root-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Unidade Industrial SP',
    asset_type: 'Unidade Industrial',
    location: 'São Paulo - SP',
    description: 'Principal unidade fabril com linhas de produção e utilidades.',
    parent_asset_id: null,
    productive_capacity: 4200,
    capacity_unit: 'ton/mês',
    installation_year: 2019,
    operational_status: 'Ativo',
    pollution_potential: 'Médio',
    cnae_code: '20.51-7/00',
    monitoring_frequency: 'Mensal',
    critical_parameters: ['NOx', 'Material Particulado', 'CO2'],
    monitoring_responsible: 'Equipe de Meio Ambiente',
    created_at: '2024-01-02T08:00:00Z',
    updated_at: '2026-02-12T11:20:00Z',
    linked_emission_sources: [
      { id: 'es-1', name: 'Caldeira 01', category: 'Combustão Estacionária', scope: 1, status: 'Ativo' },
      { id: 'es-2', name: 'Energia Elétrica', category: 'Eletricidade Comprada', scope: 2, status: 'Ativo' },
    ],
    linked_licenses: [
      { id: 'lic-1', name: 'Licença de Operação', type: 'Operação', status: 'Ativa', expiration_date: '2027-01-15', issuing_body: 'CETESB' },
      { id: 'lic-2', name: 'Outorga de Água', type: 'Recursos Hídricos', status: 'Ativa', expiration_date: '2026-10-20', issuing_body: 'DAEE' },
    ],
    linked_waste_logs: [
      { id: 'wl-1', mtr_number: 'MTR-2026-001', waste_description: 'Lodo industrial classe I', quantity: 4.2, unit: 'ton', collection_date: '2026-02-10', status: 'Coletado' },
      { id: 'wl-2', mtr_number: 'MTR-2026-002', waste_description: 'Embalagens contaminadas', quantity: 1.1, unit: 'ton', collection_date: '2026-02-06', status: 'Destinação Finalizada' },
    ],
    kpis: {
      total_emissions: 2,
      active_licenses: 2,
      waste_records: 2,
    },
  },
  'asset-boiler-1': {
    id: 'asset-boiler-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Caldeira 01',
    asset_type: 'Fonte Fixa de Combustão',
    location: 'Bloco A',
    description: 'Caldeira a gás natural para geração de vapor.',
    parent_asset_id: 'asset-root-1',
    operational_status: 'Ativo',
    pollution_potential: 'Alto',
    cnae_code: '35.30-1/00',
    monitoring_frequency: 'Semanal',
    critical_parameters: ['NOx', 'CO'],
    monitoring_responsible: 'Operação de Utilidades',
    created_at: '2024-02-10T08:00:00Z',
    updated_at: '2026-02-12T11:20:00Z',
    linked_emission_sources: [
      { id: 'es-1', name: 'Caldeira 01', category: 'Combustão Estacionária', scope: 1, status: 'Ativo' },
    ],
    linked_licenses: [
      { id: 'lic-1', name: 'Licença de Operação', type: 'Operação', status: 'Ativa', expiration_date: '2027-01-15', issuing_body: 'CETESB' },
    ],
    linked_waste_logs: [
      { id: 'wl-1', mtr_number: 'MTR-2026-001', waste_description: 'Lodo industrial classe I', quantity: 4.2, unit: 'ton', collection_date: '2026-02-10', status: 'Coletado' },
    ],
    kpis: {
      total_emissions: 1,
      active_licenses: 1,
      waste_records: 1,
    },
  },
  'asset-stack-1': {
    id: 'asset-stack-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Chaminé Norte',
    asset_type: 'Chaminé/Stack',
    location: 'Bloco A',
    description: 'Ponto de monitoramento contínuo de emissões.',
    parent_asset_id: 'asset-root-1',
    operational_status: 'Ativo',
    pollution_potential: 'Médio',
    monitoring_frequency: 'Mensal',
    critical_parameters: ['Particulados', 'NOx'],
    monitoring_responsible: 'Laboratório Ambiental',
    created_at: '2024-02-10T08:00:00Z',
    updated_at: '2026-02-12T11:20:00Z',
    linked_emission_sources: [],
    linked_licenses: [],
    linked_waste_logs: [],
    kpis: {
      total_emissions: 0,
      active_licenses: 0,
      waste_records: 0,
    },
  },
  'asset-root-2': {
    id: 'asset-root-2',
    company_id: DEMO_COMPANY_ID,
    name: 'Centro de Distribuição RJ',
    asset_type: 'Infraestrutura Auxiliar',
    location: 'Rio de Janeiro - RJ',
    description: 'Centro logístico para distribuição nacional.',
    parent_asset_id: null,
    operational_status: 'Ativo',
    pollution_potential: 'Baixo',
    monitoring_frequency: 'Trimestral',
    critical_parameters: ['Consumo de Energia', 'Ruído'],
    monitoring_responsible: 'Time de Operações',
    created_at: '2024-03-15T08:00:00Z',
    updated_at: '2026-02-11T10:00:00Z',
    linked_emission_sources: [
      { id: 'es-3', name: 'Frota Leve', category: 'Combustão Móvel', scope: 1, status: 'Ativo' },
    ],
    linked_licenses: [],
    linked_waste_logs: [],
    kpis: {
      total_emissions: 1,
      active_licenses: 0,
      waste_records: 0,
    },
  },
  'asset-vehicle-1': {
    id: 'asset-vehicle-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Caminhão Baú 14T',
    asset_type: 'Fonte Móvel',
    location: 'Pátio RJ',
    description: 'Veículo para entregas regionais.',
    parent_asset_id: 'asset-root-2',
    operational_status: 'Ativo',
    pollution_potential: 'Médio',
    monitoring_frequency: 'Mensal',
    critical_parameters: ['Consumo Diesel', 'KM Rodado'],
    monitoring_responsible: 'Gestão de Frota',
    created_at: '2024-04-01T08:00:00Z',
    updated_at: '2026-02-11T10:00:00Z',
    linked_emission_sources: [
      { id: 'es-3', name: 'Frota Leve', category: 'Combustão Móvel', scope: 1, status: 'Ativo' },
    ],
    linked_licenses: [],
    linked_waste_logs: [],
    kpis: {
      total_emissions: 1,
      active_licenses: 0,
      waste_records: 0,
    },
  },
};

const DEMO_WASTE_LOGS = [
  {
    id: 'wl-1',
    mtr_number: 'MTR-2026-001',
    waste_description: 'Lodo industrial classe I',
    collection_date: '10/02/2026',
    quantity: 4.2,
    unit: 'tonelada',
    status: 'Coletado',
    waste_class: 'Classe I - Perigoso',
    destination_name: 'EcoDestino Tratamentos',
  },
  {
    id: 'wl-2',
    mtr_number: 'MTR-2026-002',
    waste_description: 'Embalagens contaminadas',
    collection_date: '06/02/2026',
    quantity: 1.1,
    unit: 'tonelada',
    status: 'Destinação Finalizada',
    waste_class: 'Classe II A - Não Inerte',
    destination_name: 'ReciclaSul',
  },
  {
    id: 'wl-3',
    mtr_number: 'MTR-2026-003',
    waste_description: 'Resíduo plástico reciclável',
    collection_date: '02/02/2026',
    quantity: 2.8,
    unit: 'tonelada',
    status: 'Em Trânsito',
    waste_class: 'Classe II B - Inerte',
    destination_name: 'Cooperativa Nova Vida',
  },
];

const DEMO_WASTE_LOG_DETAIL = {
  id: 'wl-1',
  mtr_number: 'MTR-2026-001',
  waste_description: 'Lodo industrial classe I',
  collection_date: '2026-02-10',
  quantity: 4.2,
  unit: 'tonelada',
  status: 'Coletado',
  waste_class: 'Classe I - Perigoso',
  transporter_name: 'EcoTransp Ltda',
  transporter_cnpj: '12345678000191',
  destination_name: 'EcoDestino Tratamentos',
  destination_cnpj: '98765432000109',
  final_treatment_type: 'Incineração',
  cost: 12800,
  company_id: DEMO_COMPANY_ID,
  created_at: '2026-02-10T11:00:00Z',
  updated_at: '2026-02-10T11:00:00Z',
};

const DEMO_WASTE_LOG_DOCUMENTS = [
  {
    id: 'wd-1',
    file_name: 'MTR-2026-001.pdf',
    file_path: 'waste-logs/wl-1/mtr-2026-001.pdf',
    created_at: '2026-02-10T11:05:00Z',
  },
  {
    id: 'wd-2',
    file_name: 'CDF-2026-001.pdf',
    file_path: 'waste-logs/wl-1/cdf-2026-001.pdf',
    created_at: '2026-02-12T15:30:00Z',
  },
];

const DEMO_ACTIVE_PGRS_PLAN = {
  id: 'pgrs-plan-1',
  plan_name: 'PGRS 2026',
  status: 'Ativo',
  goals: [
    {
      id: 'pgrs-goal-1',
      pgrs_plan_id: 'pgrs-plan-1',
      goal_type: 'Reduzir geração de resíduos perigosos',
      baseline_value: 120,
      target_value: 90,
      current_value: 98,
      unit: 'ton/ano',
      deadline: '2026-12-31',
      status: 'Em andamento',
      progress_percentage: 73,
    },
    {
      id: 'pgrs-goal-2',
      pgrs_plan_id: 'pgrs-plan-1',
      goal_type: 'Aumentar taxa de reciclagem',
      baseline_value: 55,
      target_value: 75,
      current_value: 69,
      unit: '%',
      deadline: '2026-12-31',
      status: 'Em andamento',
      progress_percentage: 70,
    },
    {
      id: 'pgrs-goal-3',
      pgrs_plan_id: 'pgrs-plan-1',
      goal_type: 'Treinar operadores em segregação',
      baseline_value: 0,
      target_value: 100,
      current_value: 88,
      unit: '%',
      deadline: '2026-10-31',
      status: 'Em andamento',
      progress_percentage: 88,
    },
  ],
};

const DEMO_PGRS_STATUS = {
  id: DEMO_ACTIVE_PGRS_PLAN.id,
  plan_name: DEMO_ACTIVE_PGRS_PLAN.plan_name,
  status: 'Ativo',
  creation_date: new Date('2026-01-05T00:00:00Z'),
  next_review_date: new Date('2026-07-05T00:00:00Z'),
  completion_percentage: 84,
  goals_count: DEMO_ACTIVE_PGRS_PLAN.goals.length,
  procedures_count: 6,
  sources_count: 4,
};

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
  {
    queryKey: ['emissions-data'],
    data: DEMO_EMISSIONS_DATA,
  },
  // Assets hierarchy for environmental assets module
  {
    queryKey: ['assets-hierarchy'],
    data: DEMO_ASSETS_HIERARCHY,
  },
  // Base and specific asset details
  {
    queryKey: ['asset-details'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-root-1'],
  },
  {
    queryKey: ['asset-details', 'asset-root-1'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-root-1'],
  },
  {
    queryKey: ['asset-details', 'asset-boiler-1'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-boiler-1'],
  },
  {
    queryKey: ['asset-details', 'asset-stack-1'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-stack-1'],
  },
  {
    queryKey: ['asset-details', 'asset-root-2'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-root-2'],
  },
  {
    queryKey: ['asset-details', 'asset-vehicle-1'],
    data: DEMO_ASSET_DETAILS_BY_ID['asset-vehicle-1'],
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
  // Waste logs and details for residuos module
  {
    queryKey: ['waste-logs'],
    data: DEMO_WASTE_LOGS,
  },
  {
    queryKey: ['waste-logs', 'detail'],
    data: DEMO_WASTE_LOG_DETAIL,
  },
  {
    queryKey: ['waste-logs', 'documents'],
    data: DEMO_WASTE_LOG_DOCUMENTS,
  },
  // PGRS status and active plan
  {
    queryKey: ['pgrs-status'],
    data: DEMO_PGRS_STATUS,
  },
  {
    queryKey: ['active-pgrs-goals'],
    data: DEMO_ACTIVE_PGRS_PLAN,
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
    data: [
      {
        id: 'ad-1',
        source_name: 'Frota Diesel - Unidade SP',
        period_start_date: '2026-01-01',
        period_end_date: '2026-01-31',
        quantity: 14200,
        unit: 'L',
        status: 'Aprovado',
      },
      {
        id: 'ad-2',
        source_name: 'Energia Elétrica - Unidade RJ',
        period_start_date: '2026-01-01',
        period_end_date: '2026-01-31',
        quantity: 365000,
        unit: 'kWh',
        status: 'Aprovado',
      },
      {
        id: 'ad-3',
        source_name: 'Gás Natural - Caldeira',
        period_start_date: '2026-01-01',
        period_end_date: '2026-01-31',
        quantity: 11800,
        unit: 'm³',
        status: 'Pendente',
      },
    ],
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
