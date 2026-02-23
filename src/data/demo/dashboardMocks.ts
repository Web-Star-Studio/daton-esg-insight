/**
 * Mock data for Dashboard module
 */

const DEMO_COMPANY_ID = 'demo-company-001';
const NOW = new Date().toISOString();

const DASHBOARD_OVERVIEW_STATS = {
  emissions: {
    value: 1247.5,
    change: -8.3,
    changeType: 'positive' as const,
  },
  compliance: {
    value: 94.5,
    change: 2.1,
    changeType: 'positive' as const,
  },
  employees: {
    value: 342,
    change: 5.2,
    changeType: 'positive' as const,
  },
  quality: {
    value: 87.3,
    change: 3.4,
    changeType: 'positive' as const,
  },
};

const GOALS_DASHBOARD_STATS = {
  activeGoals: 9,
  averageProgress: 76,
  delayedGoals: 2,
};

const INTELLIGENT_ALERTS = [
  {
    type: 'water',
    value: 894.5,
    average: 672.2,
    percentage: 33.1,
    date: NOW,
  },
  {
    type: 'energy',
    value: 5124.8,
    average: 4210.3,
    percentage: 21.7,
    date: NOW,
  },
  {
    type: 'emissions',
    value: 162.4,
    average: 127.2,
    percentage: 27.7,
    date: NOW,
  },
];

export const dashboardMockEntries = [
  {
    queryKey: ['dashboard-overview-stats'],
    data: DASHBOARD_OVERVIEW_STATS,
  },
  {
    queryKey: ['dashboard-overview-stats', undefined],
    data: DASHBOARD_OVERVIEW_STATS,
  },
  {
    queryKey: ['dashboard-stats'],
    data: GOALS_DASHBOARD_STATS,
  },
  {
    queryKey: ['dashboard-stats', undefined],
    data: GOALS_DASHBOARD_STATS,
  },
  {
    queryKey: ['intelligent-alerts'],
    data: INTELLIGENT_ALERTS,
  },
  {
    queryKey: ['intelligent-alerts', DEMO_COMPANY_ID],
    data: INTELLIGENT_ALERTS,
  },
  {
    queryKey: ['esg-scores'],
    data: {
      overall: 72.5,
      environmental: 68.0,
      social: 78.2,
      governance: 71.3,
      trend: 'up',
      lastUpdated: NOW,
      hasData: true,
    },
  },
  {
    queryKey: ['dashboard', 'alerts'],
    data: [
      { id: '1', type: 'warning', title: 'Licença ambiental próxima do vencimento', description: 'LO-2024-001 vence em 30 dias', date: NOW, read: false },
      { id: '2', type: 'info', title: 'Nova meta de redução definida', description: 'Meta de redução de 15% em emissões para 2026', date: NOW, read: false },
      { id: '3', type: 'error', title: 'NC crítica pendente', description: 'NC-2026-003 sem ação corretiva há 15 dias', date: NOW, read: false },
    ],
  },
  {
    queryKey: ['dashboard', 'predictive'],
    data: {
      predictions: [
        { metric: 'Emissões CO2', trend: 'decreasing', confidence: 0.85, forecast: 'Redução de 12% prevista para o próximo trimestre' },
        { metric: 'Consumo de Água', trend: 'stable', confidence: 0.72, forecast: 'Manutenção dos níveis atuais' },
        { metric: 'Resíduos', trend: 'decreasing', confidence: 0.68, forecast: 'Possível redução de 8% com novas práticas' },
      ],
    },
  },
  {
    queryKey: ['production-health'],
    data: {
      status: 'healthy',
      uptime: 99.2,
      activeAlerts: 2,
      lastCheck: NOW,
    },
  },
  // Additional dashboard keys used by Index.tsx
  {
    queryKey: ['esg-dashboard'],
    data: {
      overall_esg_score: 72,
      environmental: {
        score: 68,
        kpis: [
          { key: 'total_emissions', label: 'Emissões Totais', value: '1247.5', trend: -8.3, unit: 'tCO₂e' },
          { key: 'recycling_rate', label: 'Taxa de Reciclagem', value: '72.5', trend: 4.1, unit: '%' },
          { key: 'license_compliance', label: 'Licenças em Conformidade', value: '94.5', trend: 2.1, unit: '%' },
        ],
      },
      social: {
        score: 78,
        kpis: [
          { key: 'training_hours', label: 'Horas de Treinamento/Colab.', value: '28', trend: 3.2, unit: 'h' },
          { key: 'turnover_rate', label: 'Taxa de Rotatividade', value: '7.1', trend: -1.3, unit: '%' },
          { key: 'diversity_index', label: 'Índice de Diversidade', value: '7.4', trend: 0.6, unit: '/10' },
        ],
      },
      governance: {
        score: 71,
        kpis: [
          { key: 'goals_on_track', label: '% Metas no Prazo', value: '76', trend: 5.0, unit: '%' },
          { key: 'policy_compliance', label: 'Conformidade com Políticas', value: '93', trend: 1.7, unit: '%' },
          { key: 'board_diversity', label: 'Diversidade do Conselho', value: '42', trend: 2.3, unit: '%' },
        ],
      },
    },
  },
  {
    queryKey: ['emission-stats'],
    data: {
      total: 1247.5,
      escopo1: 485.3,
      escopo2: 312.8,
      escopo3: 449.4,
      ativas: 14,
      fontes_total: 19,
    },
  },
  {
    queryKey: ['license-stats'],
    data: {
      total: 3,
      active: 2,
      upcoming: 1,
      expired: 0,
    },
  },
  {
    queryKey: ['waste-dashboard'],
    data: {
      total_generated: { value: 94.8, unit: 'toneladas' },
      recycling_rate_percent: 72.5,
      sent_to_landfill: { value: 18.3, unit: 'toneladas' },
      disposal_cost_month: 28750,
    },
  },
];
