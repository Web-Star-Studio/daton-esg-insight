/**
 * Mock data for ESG Management module
 */

const DEMO_COMPANY_ID = 'demo-company-001';

export const esgMockEntries = [
  {
    queryKey: ['esg-management', DEMO_COMPANY_ID],
    data: {
      overallScore: 72.5,
      environmental: 68.0,
      social: 78.2,
      governance: 71.3,
      categories: [
        { name: 'Ambiental', score: 68, weight: 0.35 },
        { name: 'Social', score: 78, weight: 0.35 },
        { name: 'Governança', score: 71, weight: 0.30 },
      ],
    },
  },
  // ESG management (base)
  {
    queryKey: ['esg-management'],
    data: {
      overallScore: 72.5,
      environmental: 68.0,
      social: 78.2,
      governance: 71.3,
    },
  },
  {
    queryKey: ['goals', DEMO_COMPANY_ID],
    data: [
      { id: '1', goal_name: 'Reduzir emissões GEE em 15%', description: 'Meta de redução de gases de efeito estufa', target_value: 15, current_value: 8.3, unit: '%', status: 'Em Andamento', category: 'Ambiental', deadline: '2026-12-31', created_at: '2025-01-15', updated_at: '2026-01-20', company_id: DEMO_COMPANY_ID },
      { id: '2', goal_name: 'Certificação ISO 14001', description: 'Obter certificação ambiental', target_value: 100, current_value: 65, unit: '%', status: 'Em Andamento', category: 'Qualidade', deadline: '2026-06-30', created_at: '2025-03-01', updated_at: '2026-02-01', company_id: DEMO_COMPANY_ID },
      { id: '3', goal_name: 'Zero acidentes de trabalho', description: 'Eliminar acidentes com afastamento', target_value: 0, current_value: 2, unit: 'acidentes', status: 'Em Andamento', category: 'Social', deadline: '2026-12-31', created_at: '2025-01-01', updated_at: '2026-01-15', company_id: DEMO_COMPANY_ID },
      { id: '4', goal_name: 'Reduzir consumo de água em 10%', description: 'Otimização do uso de recursos hídricos', target_value: 10, current_value: 6.2, unit: '%', status: 'Em Andamento', category: 'Ambiental', deadline: '2026-12-31', created_at: '2025-02-01', updated_at: '2026-02-05', company_id: DEMO_COMPANY_ID },
      { id: '5', goal_name: 'Treinamento ESG para 100% dos líderes', description: 'Capacitação em sustentabilidade', target_value: 100, current_value: 82, unit: '%', status: 'Em Andamento', category: 'Governança', deadline: '2026-06-30', created_at: '2025-04-01', updated_at: '2026-01-30', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Goals (base)
  {
    queryKey: ['goals'],
    data: [
      { id: '1', goal_name: 'Reduzir emissões GEE em 15%', target_value: 15, current_value: 8.3, status: 'Em Andamento' },
      { id: '2', goal_name: 'Certificação ISO 14001', target_value: 100, current_value: 65, status: 'Em Andamento' },
    ],
  },
  {
    queryKey: ['esg-indicators', DEMO_COMPANY_ID],
    data: [
      { id: '1', name: 'Emissões de CO2 (Escopo 1)', value: 845.2, unit: 'tCO2e', trend: -8.3, category: 'environmental' },
      { id: '2', name: 'Consumo de Água', value: 12450, unit: 'm³', trend: -5.2, category: 'environmental' },
      { id: '3', name: 'Resíduos Reciclados', value: 72.5, unit: '%', trend: 4.1, category: 'environmental' },
      { id: '4', name: 'Taxa de Turnover', value: 8.2, unit: '%', trend: -1.5, category: 'social' },
      { id: '5', name: 'Horas de Treinamento/Colaborador', value: 42, unit: 'h', trend: 12.3, category: 'social' },
      { id: '6', name: 'Conformidade Regulatória', value: 94.5, unit: '%', trend: 2.1, category: 'governance' },
    ],
  },
  // ESG indicators (base)
  {
    queryKey: ['esg-indicators'],
    data: [
      { id: '1', name: 'Emissões de CO2 (Escopo 1)', value: 845.2, unit: 'tCO2e', trend: -8.3, category: 'environmental' },
      { id: '2', name: 'Consumo de Água', value: 12450, unit: 'm³', trend: -5.2, category: 'environmental' },
    ],
  },
  {
    queryKey: ['materiality-topics', DEMO_COMPANY_ID],
    data: [
      { id: '1', topic: 'Mudanças Climáticas', importance_stakeholder: 9.2, importance_company: 8.8, category: 'Ambiental', is_material: true },
      { id: '2', topic: 'Gestão de Resíduos', importance_stakeholder: 8.5, importance_company: 8.2, category: 'Ambiental', is_material: true },
      { id: '3', topic: 'Saúde e Segurança', importance_stakeholder: 9.5, importance_company: 9.0, category: 'Social', is_material: true },
      { id: '4', topic: 'Diversidade e Inclusão', importance_stakeholder: 7.8, importance_company: 7.2, category: 'Social', is_material: true },
      { id: '5', topic: 'Ética e Transparência', importance_stakeholder: 9.0, importance_company: 8.5, category: 'Governança', is_material: true },
      { id: '6', topic: 'Gestão de Água', importance_stakeholder: 7.5, importance_company: 8.0, category: 'Ambiental', is_material: true },
    ],
  },
  // Materiality topics (base)
  {
    queryKey: ['materiality-topics'],
    data: [
      { id: '1', topic: 'Mudanças Climáticas', importance_stakeholder: 9.2, importance_company: 8.8, is_material: true },
      { id: '3', topic: 'Saúde e Segurança', importance_stakeholder: 9.5, importance_company: 9.0, is_material: true },
    ],
  },
];
