/**
 * Mock data for Dashboard module
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const dashboardMockEntries = [
  {
    queryKey: ['dashboard-stats'],
    data: {
      totalEmissions: 1247.5,
      emissionsChange: -8.3,
      totalEmployees: 342,
      employeesChange: 5.2,
      complianceRate: 94.5,
      complianceChange: 2.1,
      qualityScore: 87.3,
      qualityChange: 3.4,
      supplierScore: 91.2,
      supplierChange: 1.8,
      energyConsumption: 4520,
      energyChange: -5.7,
      co2Reduction: 12.4,
      co2ReductionChange: 15.2,
    },
  },
  {
    queryKey: ['dashboard-stats', undefined],
    data: {
      totalEmissions: 1247.5,
      emissionsChange: -8.3,
      totalEmployees: 342,
      employeesChange: 5.2,
      complianceRate: 94.5,
      complianceChange: 2.1,
      qualityScore: 87.3,
      qualityChange: 3.4,
      supplierScore: 91.2,
      supplierChange: 1.8,
      energyConsumption: 4520,
      energyChange: -5.7,
      co2Reduction: 12.4,
      co2ReductionChange: 15.2,
    },
  },
  {
    queryKey: ['esg-scores'],
    data: {
      overall: 72.5,
      environmental: 68.0,
      social: 78.2,
      governance: 71.3,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
    },
  },
  {
    queryKey: ['dashboard', 'alerts'],
    data: [
      { id: '1', type: 'warning', title: 'Licença ambiental próxima do vencimento', description: 'LO-2024-001 vence em 30 dias', date: new Date().toISOString(), read: false },
      { id: '2', type: 'info', title: 'Nova meta de redução definida', description: 'Meta de redução de 15% em emissões para 2026', date: new Date().toISOString(), read: false },
      { id: '3', type: 'error', title: 'NC crítica pendente', description: 'NC-2026-003 sem ação corretiva há 15 dias', date: new Date().toISOString(), read: false },
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
      lastCheck: new Date().toISOString(),
    },
  },
  // Additional dashboard keys used by Index.tsx
  {
    queryKey: ['esg-dashboard'],
    data: {
      overall: 72.5,
      environmental: 68.0,
      social: 78.2,
      governance: 71.3,
      trend: 'up',
    },
  },
  {
    queryKey: ['emission-stats'],
    data: {
      totalEmissions: 1247.5,
      scope1: 485.3,
      scope2: 312.8,
      scope3: 449.4,
      trend: -8.3,
    },
  },
  {
    queryKey: ['license-stats'],
    data: {
      total: 3,
      active: 2,
      expiring: 1,
      expired: 0,
    },
  },
  {
    queryKey: ['waste-dashboard'],
    data: {
      totalGenerated: 94.8,
      recyclingRate: 72.5,
      hazardous: 12.5,
      nonHazardous: 82.3,
      trend: -4.1,
    },
  },
];
