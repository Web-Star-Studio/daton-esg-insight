/**
 * Mock data for the Gestão de Indicadores module (indicatorManagement service).
 * Covers queryKeys: indicator-groups, indicators-with-data, indicator-stats,
 * indicator-period-data, indicator-collections.
 */

const DEMO_COMPANY_ID = 'demo-company-001';
const CURRENT_YEAR = 2026;
const NOW = '2026-02-25T12:00:00Z';

// ─── Indicator Groups ─────────────────────────────────────────────────────────

const MOCK_INDICATOR_GROUPS = [
  {
    id: 'demo-ig-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Indicadores Ambientais',
    description: 'Métricas de desempenho ambiental e eficiência de recursos',
    icon: 'Leaf',
    color: '#22c55e',
    display_order: 1,
    is_active: true,
    indicators_count: 2,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'demo-ig-2',
    company_id: DEMO_COMPANY_ID,
    name: 'Indicadores Sociais',
    description: 'Métricas de desempenho social e gestão de pessoas',
    icon: 'Users',
    color: '#3b82f6',
    display_order: 2,
    is_active: true,
    indicators_count: 2,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'demo-ig-3',
    company_id: DEMO_COMPANY_ID,
    name: 'Governança',
    description: 'Indicadores de governança corporativa e conformidade',
    icon: 'Shield',
    color: '#8b5cf6',
    display_order: 3,
    is_active: true,
    indicators_count: 1,
    created_at: NOW,
    updated_at: NOW,
  },
];

// ─── Period data generator (stable, deterministic) ────────────────────────────

function makePeriodData(
  indicatorId: string,
  targets: number[],      // target per month [Jan..Dec]
  values: (number | null)[],  // measured value per month (null = pending)
  statuses: string[]      // status per month
) {
  return targets.map((target, idx) => ({
    id: `demo-pd-${indicatorId}-${idx + 1}`,
    indicator_id: indicatorId,
    collection_id: null,
    company_id: DEMO_COMPANY_ID,
    period_year: CURRENT_YEAR,
    period_month: idx + 1,
    year: CURRENT_YEAR,
    month: idx + 1,
    measured_value: values[idx],
    target_value: target,
    deviation_value: values[idx] != null ? values[idx]! - target : null,
    deviation_percentage: values[idx] != null ? ((values[idx]! - target) / target) * 100 : null,
    status: statuses[idx],
    needs_action_plan: statuses[idx] === 'critical',
    action_plan_id: null,
    notes: null,
    observation: null,
    collected_by_user_id: 'demo-user-001',
    collected_at: statuses[idx] !== 'pending' ? NOW : null,
    created_at: NOW,
    updated_at: NOW,
  }));
}

// ─── Mock Indicators with Period Data ────────────────────────────────────────

const MOCK_INDICATORS_WITH_DATA = [
  {
    id: 'demo-ind-1',
    company_id: DEMO_COMPANY_ID,
    name: 'Consumo de Energia Elétrica',
    code: 'AMB-001',
    description: 'Consumo mensal de energia elétrica em kWh',
    category: 'Ambiental',
    measurement_unit: 'kWh',
    unit: 'kWh',
    measurement_type: 'manual',
    calculation_formula: null,
    frequency: 'monthly',
    responsible_user_id: 'demo-user-001',
    data_source: 'Conta de energia',
    collection_method: 'Leitura de medidor',
    is_active: true,
    created_by_user_id: 'demo-user-001',
    created_at: NOW,
    updated_at: NOW,
    strategic_objective: 'Reduzir consumo energético em 10% ao ano',
    location: 'Sede',
    direction: 'lower_better',
    tolerance_value: 5,
    target_value: 45000,
    icon: 'Zap',
    group_id: 'demo-ig-1',
    auto_analysis: false,
    analysis_instructions: null,
    suggested_actions: null,
    status: 'active',
    indicator_group: MOCK_INDICATOR_GROUPS[0],
    indicator_targets: [],
    period_data: makePeriodData(
      'demo-ind-1',
      [45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000],
      [42000, 43500, null, null, null, null, null, null, null, null, null, null],
      ['on_target', 'warning', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    ),
    collections: [],
  },
  {
    id: 'demo-ind-2',
    company_id: DEMO_COMPANY_ID,
    name: 'Geração de Resíduos Sólidos',
    code: 'AMB-002',
    description: 'Volume total de resíduos gerados por mês em toneladas',
    category: 'Ambiental',
    measurement_unit: 't',
    unit: 't',
    measurement_type: 'manual',
    calculation_formula: null,
    frequency: 'monthly',
    responsible_user_id: 'demo-user-001',
    data_source: 'Manifesto de resíduos',
    collection_method: 'Pesagem na saída',
    is_active: true,
    created_by_user_id: 'demo-user-001',
    created_at: NOW,
    updated_at: NOW,
    strategic_objective: 'Redução de 15% na geração de resíduos',
    location: 'Planta Industrial',
    direction: 'lower_better',
    tolerance_value: 10,
    target_value: 8.5,
    icon: 'Trash2',
    group_id: 'demo-ig-1',
    auto_analysis: false,
    analysis_instructions: null,
    suggested_actions: null,
    status: 'active',
    indicator_group: MOCK_INDICATOR_GROUPS[0],
    indicator_targets: [],
    period_data: makePeriodData(
      'demo-ind-2',
      [8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5],
      [9.2, 8.8, null, null, null, null, null, null, null, null, null, null],
      ['critical', 'warning', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    ),
    collections: [],
  },
  {
    id: 'demo-ind-3',
    company_id: DEMO_COMPANY_ID,
    name: 'Taxa de Absenteísmo',
    code: 'SOC-001',
    description: 'Percentual de ausências não programadas em relação ao total de horas trabalhadas',
    category: 'Social',
    measurement_unit: '%',
    unit: '%',
    measurement_type: 'calculated',
    calculation_formula: '(horas_ausencia / horas_totais) * 100',
    frequency: 'monthly',
    responsible_user_id: 'demo-user-002',
    data_source: 'Sistema de RH',
    collection_method: 'Cálculo automático via sistema',
    is_active: true,
    created_by_user_id: 'demo-user-001',
    created_at: NOW,
    updated_at: NOW,
    strategic_objective: 'Manter absenteísmo abaixo de 3%',
    location: 'Todas as unidades',
    direction: 'lower_better',
    tolerance_value: 0.5,
    target_value: 3.0,
    icon: 'UserX',
    group_id: 'demo-ig-2',
    auto_analysis: false,
    analysis_instructions: null,
    suggested_actions: null,
    status: 'active',
    indicator_group: MOCK_INDICATOR_GROUPS[1],
    indicator_targets: [],
    period_data: makePeriodData(
      'demo-ind-3',
      [3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0],
      [2.1, 2.4, null, null, null, null, null, null, null, null, null, null],
      ['on_target', 'on_target', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    ),
    collections: [],
  },
  {
    id: 'demo-ind-4',
    company_id: DEMO_COMPANY_ID,
    name: 'Horas de Treinamento por Colaborador',
    code: 'SOC-002',
    description: 'Média de horas de treinamento por colaborador no mês',
    category: 'Social',
    measurement_unit: 'h',
    unit: 'h',
    measurement_type: 'manual',
    calculation_formula: null,
    frequency: 'monthly',
    responsible_user_id: 'demo-user-002',
    data_source: 'LMS / Sistema de Treinamentos',
    collection_method: 'Relatório mensal de treinamentos',
    is_active: true,
    created_by_user_id: 'demo-user-001',
    created_at: NOW,
    updated_at: NOW,
    strategic_objective: 'Garantir mínimo de 4h/colaborador/mês',
    location: 'Todas as unidades',
    direction: 'higher_better',
    tolerance_value: 0.5,
    target_value: 4.0,
    icon: 'BookOpen',
    group_id: 'demo-ig-2',
    auto_analysis: false,
    analysis_instructions: null,
    suggested_actions: null,
    status: 'active',
    indicator_group: MOCK_INDICATOR_GROUPS[1],
    indicator_targets: [],
    period_data: makePeriodData(
      'demo-ind-4',
      [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
      [4.8, 5.2, null, null, null, null, null, null, null, null, null, null],
      ['on_target', 'on_target', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    ),
    collections: [],
  },
  {
    id: 'demo-ind-5',
    company_id: DEMO_COMPANY_ID,
    name: 'Conformidade com Licenças Ambientais',
    code: 'GOV-001',
    description: 'Percentual de licenças ambientais válidas e em conformidade',
    category: 'Governança',
    measurement_unit: '%',
    unit: '%',
    measurement_type: 'manual',
    calculation_formula: null,
    frequency: 'monthly',
    responsible_user_id: 'demo-user-001',
    data_source: 'Sistema de Licenciamento',
    collection_method: 'Verificação mensal de validade',
    is_active: true,
    created_by_user_id: 'demo-user-001',
    created_at: NOW,
    updated_at: NOW,
    strategic_objective: 'Manter 100% de conformidade com licenças',
    location: 'Todas as unidades',
    direction: 'higher_better',
    tolerance_value: 2,
    target_value: 100,
    icon: 'FileCheck',
    group_id: 'demo-ig-3',
    auto_analysis: false,
    analysis_instructions: null,
    suggested_actions: null,
    status: 'active',
    indicator_group: MOCK_INDICATOR_GROUPS[2],
    indicator_targets: [],
    period_data: makePeriodData(
      'demo-ind-5',
      [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      [100, 100, null, null, null, null, null, null, null, null, null, null],
      ['on_target', 'on_target', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    ),
    collections: [],
  },
];

// ─── Indicator Stats ──────────────────────────────────────────────────────────

const MOCK_INDICATOR_STATS = {
  total: 5,
  on_target: 3,
  warning: 1,
  critical: 1,
  pending: 0,
  completion_rate: 80,
};

// ─── Mock entries for queryResolver cache ─────────────────────────────────────

export const indicatorMockEntries = [
  // Groups (no dynamic params)
  { queryKey: ['indicator-groups'] as const, data: MOCK_INDICATOR_GROUPS },

  // Indicators with data — with and without year param
  { queryKey: ['indicators-with-data'] as const, data: MOCK_INDICATORS_WITH_DATA },
  { queryKey: ['indicators-with-data', CURRENT_YEAR] as const, data: MOCK_INDICATORS_WITH_DATA },

  // Stats — with and without year param
  { queryKey: ['indicator-stats'] as const, data: MOCK_INDICATOR_STATS },
  { queryKey: ['indicator-stats', CURRENT_YEAR] as const, data: MOCK_INDICATOR_STATS },

  // Period data per indicator (covers all demo indicators)
  ...MOCK_INDICATORS_WITH_DATA.map((ind) => ({
    queryKey: ['indicator-period-data', ind.id, CURRENT_YEAR] as const,
    data: ind.period_data,
  })),

  // Collections per indicator (empty — no sub-variables defined in demo)
  ...MOCK_INDICATORS_WITH_DATA.map((ind) => ({
    queryKey: ['indicator-collections', ind.id] as const,
    data: [],
  })),
];
