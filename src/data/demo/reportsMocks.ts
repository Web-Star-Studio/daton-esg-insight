/**
 * Mock data for Reports and AI modules (smart templates, AI health)
 */

export const reportsMockEntries = [
  // AI health status — used by useAIHealth hook in ExtracoesDocumentos.tsx
  {
    queryKey: ['ai-health'],
    data: {
      status: 'healthy',
      avgProcessingTime: 1.2,
      errorRate: 0.2,
      successRate: 99.8,
      queueLength: 0,
      lastProcessed: null,
      issues: [],
    },
  },
  // Smart report templates — used by SmartTemplateSelector.tsx
  {
    queryKey: ['smart-templates'],
    data: [
      {
        id: 'st-1',
        name: 'Relatório ESG Anual',
        description: 'Relatório completo de desempenho ESG com indicadores GRI e SASB.',
        category: 'esg',
        ai_enhanced: true,
        data_sources: ['Emissões GEE', 'Consumo de Água', 'Resíduos', 'Saúde & Segurança'],
        frequency: 'annual',
        next_generation: null,
        insights_count: 12,
        accuracy_score: 94,
      },
      {
        id: 'st-2',
        name: 'Relatório de Conformidade',
        description: 'Status atualizado de compliance com frameworks regulatórios e normativos.',
        category: 'compliance',
        ai_enhanced: true,
        data_sources: ['Compliance', 'Licenças', 'Auditorias'],
        frequency: 'quarterly',
        next_generation: null,
        insights_count: 8,
        accuracy_score: 91,
      },
      {
        id: 'st-3',
        name: 'Relatório de Governança',
        description: 'Estrutura do conselho, diversidade e práticas de governança corporativa.',
        category: 'governance',
        ai_enhanced: false,
        data_sources: ['Conselho', 'Canal de Ética', 'Políticas Corporativas'],
        frequency: 'annual',
        next_generation: null,
        insights_count: 6,
        accuracy_score: 88,
      },
      {
        id: 'st-4',
        name: 'Relatório de Emissões CDP',
        description: 'Divulgação de emissões conforme metodologia CDP/GHG Protocol.',
        category: 'emissions',
        ai_enhanced: true,
        data_sources: ['Emissões GEE Escopo 1', 'Emissões GEE Escopo 2', 'Energia'],
        frequency: 'annual',
        next_generation: null,
        insights_count: 10,
        accuracy_score: 96,
      },
      {
        id: 'st-5',
        name: 'Relatório de Qualidade',
        description: 'Indicadores de qualidade, não conformidades e ações corretivas.',
        category: 'quality',
        ai_enhanced: false,
        data_sources: ['Indicadores de Qualidade', 'Reclamações', 'Auditorias'],
        frequency: 'monthly',
        next_generation: null,
        insights_count: 5,
        accuracy_score: 85,
      },
    ],
  },
  // AI extraction stats — AIExtractionStats.tsx (queryKey: ['ai-extraction-stats'])
  // Without this, queryResolver returns {} (empty object). The !stats guard passes (truthy),
  // but stats.avgConfidence is undefined, crashing .toFixed(1).
  {
    queryKey: ['ai-extraction-stats'],
    data: {
      totalJobs: 12,
      completedJobs: 10,
      errorJobs: 1,
      avgConfidence: 91.2,
      approvedCount: 8,
      pendingCount: 2,
      rejectedCount: 0,
      approvalRate: 80.0,
      successRate: 83.3,
    },
  },
  // Document extraction approval previews — DocumentExtractionApproval.tsx (queryKey: ['extraction-previews'])
  // Empty array: no pending approval items in demo mode
  {
    queryKey: ['extraction-previews'],
    data: [],
  },
  // Intelligent reporting dashboard insights — IntelligentReportingDashboard.tsx (queryKey: ['dashboard-insights'])
  {
    queryKey: ['dashboard-insights'],
    data: [
      {
        id: 'di-1',
        type: 'recommendation',
        priority: 'high',
        title: 'Reduzir emissões Escopo 1 em 15%',
        description: 'Com base nos dados de consumo, é possível reduzir emissões Escopo 1 substituindo parte da frota por veículos elétricos.',
        data_source: 'Emissões GEE',
        confidence: 87,
        actionable: true,
        created_at: '2026-02-20T10:00:00Z',
      },
      {
        id: 'di-2',
        type: 'warning',
        priority: 'high',
        title: 'Meta hídrica em risco',
        description: 'O consumo de água em fevereiro superou o limite planejado em 12%. Revisar processos de reciclagem interna.',
        data_source: 'Água',
        confidence: 92,
        actionable: true,
        created_at: '2026-02-22T08:00:00Z',
      },
      {
        id: 'di-3',
        type: 'opportunity',
        priority: 'medium',
        title: 'Energia solar — payback em 4 anos',
        description: 'Instalação de painéis solares na sede pode gerar economia de R$ 280 mil/ano com retorno em menos de 4 anos.',
        data_source: 'Energia',
        confidence: 79,
        actionable: true,
        created_at: '2026-02-18T14:00:00Z',
      },
      {
        id: 'di-4',
        type: 'trend',
        priority: 'low',
        title: 'Melhoria contínua em diversidade',
        description: 'A participação feminina em cargos de liderança cresceu 3,2 p.p. no último trimestre, alinhada com a meta 2026.',
        data_source: 'Social',
        confidence: 95,
        actionable: false,
        created_at: '2026-02-15T11:00:00Z',
      },
    ],
  },
  // Intelligent reporting analytics — IntelligentReportingDashboard.tsx (queryKey: ['reporting-analytics'])
  {
    queryKey: ['reporting-analytics'],
    data: {
      total_reports_generated: 24,
      ai_accuracy_average: 91.4,
      insights_generated: 87,
      time_saved_hours: 148,
      top_categories: [
        { name: 'Ambiental', count: 9 },
        { name: 'ESG', count: 7 },
        { name: 'Conformidade', count: 5 },
        { name: 'Governança', count: 3 },
      ],
      monthly_trend: [
        { month: 'Out/25', reports: 3, insights: 11 },
        { month: 'Nov/25', reports: 4, insights: 14 },
        { month: 'Dez/25', reports: 5, insights: 18 },
        { month: 'Jan/26', reports: 6, insights: 22 },
        { month: 'Fev/26', reports: 6, insights: 22 },
      ],
    },
  },
  // Widget smart templates — RealtimeReportingWidget.tsx on GovernancaESG (queryKey: ['widget-smart-templates'])
  // NOTE: Different from ['smart-templates'] used in relatorios-integrados
  {
    queryKey: ['widget-smart-templates'],
    data: [
      { id: 'wst-1', name: 'Relatório ESG Trimestral', description: 'Consolidação de indicadores ESG do trimestre', category: 'esg', ai_enhanced: true, data_sources: ['Emissões', 'Água', 'Resíduos'], frequency: 'quarterly', next_generation: '2026-04-01T00:00:00Z', insights_count: 8, accuracy_score: 94 },
      { id: 'wst-2', name: 'Dashboard de Sustentabilidade', description: 'Métricas de sustentabilidade corporativa', category: 'esg', ai_enhanced: false, data_sources: ['Energia', 'GEE'], frequency: 'monthly', next_generation: '2026-03-01T00:00:00Z', insights_count: 5, accuracy_score: 88 },
      { id: 'wst-3', name: 'Relatório de Conformidade', description: 'Status de conformidade regulatória', category: 'compliance', ai_enhanced: true, data_sources: ['Licenças', 'Auditoria'], frequency: 'monthly', next_generation: '2026-03-15T00:00:00Z', insights_count: 4, accuracy_score: 91 },
    ],
  },
  // Widget recent insights — RealtimeReportingWidget.tsx (queryKey: ['widget-recent-insights'])
  { queryKey: ['widget-recent-insights'], data: [] },
];
