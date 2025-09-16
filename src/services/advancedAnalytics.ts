import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Interface for analytics data
export interface AnalyticsData {
  summary: {
    total_emissions: number;
    trend: number;
    scope1_percentage: number;
    scope2_percentage: number;
    scope3_percentage: number;
    intensity: number;
  };
  monthly_trends: Array<{
    month: string;
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  }>;
  category_breakdown: Array<{
    category: string;
    emissions: number;
    percentage: number;
  }>;
  top_sources: Array<{
    name: string;
    category: string;
    emissions: number;
    percentage: number;
  }>;
  insights: string[];
  recommendations: Array<{
    title: string;
    description: string;
    potential_reduction?: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface BenchmarkData {
  sector_comparison: Array<{
    metric: string;
    your_company: number;
    sector_average: number;
    best_practice: number;
  }>;
  performance_indicators: Array<{
    name: string;
    score: number;
    description: string;
    status: string;
  }>;
}

// Get advanced emission analytics
export async function getAdvancedEmissionAnalytics(period: string): Promise<AnalyticsData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  // Calculate date range
  const endDate = new Date();
  const months = parseInt(period.replace('months', ''));
  const startDate = subMonths(endDate, months);

  // Get emission sources with calculated emissions
  const { data: emissionData, error } = await supabase
    .from('emission_sources')
    .select(`
      *,
      activity_data(
        *,
        calculated_emissions(*)
      )
    `)
    .eq('company_id', profile.company_id);

  if (error) throw error;

  // Process data for analytics
  const processedData = processEmissionData(emissionData || [], startDate, endDate);
  
  return processedData;
}

// Process emission data for analytics
function processEmissionData(emissionData: any[], startDate: Date, endDate: Date): AnalyticsData {
  // Calculate totals by scope
  let totalEmissions = 0;
  let scope1Total = 0;
  let scope2Total = 0;
  let scope3Total = 0;
  
  const categoryTotals: Record<string, number> = {};
  const sourceTotals: Array<{ name: string; category: string; emissions: number }> = [];

  emissionData.forEach(source => {
    const sourceEmissions = source.activity_data?.reduce((sum: number, activity: any) => {
      return sum + (activity.calculated_emissions?.reduce((calcSum: number, calc: any) => {
        return calcSum + (calc.total_co2e || 0);
      }, 0) || 0);
    }, 0) || 0;

    if (sourceEmissions > 0) {
      totalEmissions += sourceEmissions;
      
      if (source.scope === 1) scope1Total += sourceEmissions;
      else if (source.scope === 2) scope2Total += sourceEmissions;
      else if (source.scope === 3) scope3Total += sourceEmissions;

      categoryTotals[source.category] = (categoryTotals[source.category] || 0) + sourceEmissions;
      sourceTotals.push({
        name: source.name,
        category: source.category,
        emissions: sourceEmissions
      });
    }
  });

  // Sort sources by emissions (descending)
  sourceTotals.sort((a, b) => b.emissions - a.emissions);

  // Generate monthly trends (mock data for now)
  const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(endDate, 11 - i);
    const monthName = format(date, 'MMM/yyyy');
    
    return {
      month: monthName,
      scope1: scope1Total * (0.7 + Math.random() * 0.6) / 12,
      scope2: scope2Total * (0.7 + Math.random() * 0.6) / 12,
      scope3: scope3Total * (0.7 + Math.random() * 0.6) / 12,
      total: totalEmissions * (0.7 + Math.random() * 0.6) / 12
    };
  });

  // Category breakdown
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, emissions]) => ({
      category,
      emissions,
      percentage: Math.round((emissions / totalEmissions) * 100)
    }))
    .sort((a, b) => b.emissions - a.emissions);

  // Top sources
  const topSources = sourceTotals.slice(0, 5).map(source => ({
    ...source,
    percentage: Math.round((source.emissions / totalEmissions) * 100)
  }));

  // Generate insights
  const insights = generateInsights({
    totalEmissions,
    scope1Total,
    scope2Total,
    scope3Total,
    categoryBreakdown,
    topSources
  });

  // Generate recommendations
  const recommendations = generateRecommendations({
    totalEmissions,
    scope1Total,
    scope2Total,
    scope3Total,
    categoryBreakdown,
    topSources
  });

  return {
    summary: {
      total_emissions: totalEmissions / 1000, // Convert to tCO2e
      trend: (Math.random() - 0.5) * 20, // Mock trend data
      scope1_percentage: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
      scope2_percentage: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
      scope3_percentage: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0,
      intensity: totalEmissions > 0 ? (totalEmissions / 1000) / emissionData.length : 0
    },
    monthly_trends: monthlyTrends.map(trend => ({
      ...trend,
      scope1: trend.scope1 / 1000,
      scope2: trend.scope2 / 1000,
      scope3: trend.scope3 / 1000,
      total: trend.total / 1000
    })),
    category_breakdown: categoryBreakdown.map(cat => ({
      ...cat,
      emissions: cat.emissions / 1000
    })),
    top_sources: topSources.map(source => ({
      ...source,
      emissions: source.emissions / 1000
    })),
    insights,
    recommendations
  };
}

// Generate insights based on data
function generateInsights(data: any): string[] {
  const insights: string[] = [];
  
  const { scope1Total, scope2Total, scope3Total, categoryBreakdown, topSources } = data;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  if (scope1Total > totalEmissions * 0.7) {
    insights.push("Emissões diretas (Escopo 1) representam mais de 70% do total - considere investimentos em eficiência energética");
  }

  if (scope2Total > totalEmissions * 0.5) {
    insights.push("Alto impacto de energia elétrica - avalie migração para fontes renováveis");
  }

  if (topSources[0]?.percentage > 50) {
    insights.push(`Fonte "${topSources[0].name}" representa ${topSources[0].percentage}% das emissões - priorize ações nesta área`);
  }

  if (categoryBreakdown.length > 0 && categoryBreakdown[0].percentage > 40) {
    insights.push(`Categoria "${categoryBreakdown[0].category}" concentra ${categoryBreakdown[0].percentage}% das emissões`);
  }

  insights.push("Dados coletados permitem identificar oportunidades de redução de emissões");
  
  return insights;
}

// Generate recommendations based on data
function generateRecommendations(data: any) {
  const recommendations: any[] = [];
  
  const { scope1Total, scope2Total, scope3Total, categoryBreakdown, topSources } = data;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  if (scope1Total > totalEmissions * 0.4) {
    recommendations.push({
      title: "Otimização de Combustão",
      description: "Implementar manutenção preventiva e upgrade de equipamentos de combustão",
      potential_reduction: 15,
      priority: 'high' as const
    });
  }

  if (scope2Total > totalEmissions * 0.3) {
    recommendations.push({
      title: "Transição Energética",
      description: "Migrar para fontes de energia renovável ou contratar energia limpa",
      potential_reduction: 25,
      priority: 'high' as const
    });
  }

  recommendations.push({
    title: "Monitoramento Contínuo",
    description: "Implementar sistema de medição e verificação das emissões",
    potential_reduction: 10,
    priority: 'medium' as const
  });

  if (scope3Total > totalEmissions * 0.2) {
    recommendations.push({
      title: "Cadeia de Valor",
      description: "Engajar fornecedores em práticas de baixo carbono",
      potential_reduction: 20,
      priority: 'medium' as const
    });
  }

  return recommendations;
}

// Get benchmark data
export async function getBenchmarkData(): Promise<BenchmarkData> {
  // Mock benchmark data - in a real implementation, this would come from industry databases
  const sectorComparison = [
    { metric: 'Intensidade de Carbono', your_company: 2.5, sector_average: 3.2, best_practice: 1.8 },
    { metric: 'Eficiência Energética', your_company: 78, sector_average: 65, best_practice: 92 },
    { metric: 'Uso de Renováveis (%)', your_company: 35, sector_average: 25, best_practice: 80 },
    { metric: 'Gestão de Resíduos', your_company: 65, sector_average: 55, best_practice: 85 }
  ];

  const performanceIndicators = [
    {
      name: 'Gestão de Carbono',
      score: 7.5,
      description: 'Estratégia e gestão de emissões',
      status: 'Acima da média setorial'
    },
    {
      name: 'Transparência',
      score: 8.2,
      description: 'Divulgação e relatórios',
      status: 'Excelente performance'
    },
    {
      name: 'Inovação',
      score: 6.1,
      description: 'Tecnologias limpas e eficiência',
      status: 'Oportunidade de melhoria'
    }
  ];

  return {
    sector_comparison: sectorComparison,
    performance_indicators: performanceIndicators
  };
}

// Export emissions report
export async function exportEmissionsReport(format: 'pdf' | 'excel' | 'csv', period: string): Promise<Blob> {
  const analyticsData = await getAdvancedEmissionAnalytics(period);
  
  if (format === 'csv') {
    return exportToCSV(analyticsData);
  } else if (format === 'excel') {
    return exportToExcel(analyticsData);
  } else {
    return exportToPDF(analyticsData);
  }
}

// Export to CSV
function exportToCSV(data: AnalyticsData): Blob {
  const csvContent = [
    // Summary
    'RESUMO EXECUTIVO',
    'Métrica,Valor',
    `Total de Emissões (tCO2e),${data.summary.total_emissions.toFixed(2)}`,
    `Tendência (%),${data.summary.trend.toFixed(1)}`,
    `Escopo 1 (%),${data.summary.scope1_percentage.toFixed(1)}`,
    `Escopo 2 (%),${data.summary.scope2_percentage.toFixed(1)}`,
    `Escopo 3 (%),${data.summary.scope3_percentage.toFixed(1)}`,
    `Intensidade de Carbono,${data.summary.intensity.toFixed(2)}`,
    '',
    // Monthly trends
    'TENDÊNCIAS MENSAIS',
    'Mês,Escopo 1,Escopo 2,Escopo 3,Total',
    ...data.monthly_trends.map(trend => 
      `${trend.month},${trend.scope1.toFixed(2)},${trend.scope2.toFixed(2)},${trend.scope3.toFixed(2)},${trend.total.toFixed(2)}`
    ),
    '',
    // Top sources
    'PRINCIPAIS FONTES',
    'Nome,Categoria,Emissões (tCO2e),Participação (%)',
    ...data.top_sources.map(source =>
      `${source.name},${source.category},${source.emissions.toFixed(2)},${source.percentage}`
    )
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Export to Excel (simplified - returns CSV for now)
function exportToExcel(data: AnalyticsData): Blob {
  // In a real implementation, you would use a library like xlsx to create proper Excel files
  return exportToCSV(data);
}

// Export to PDF (simplified - returns text for now)
function exportToPDF(data: AnalyticsData): Blob {
  const pdfContent = `
RELATÓRIO DE EMISSÕES GEE

Total de Emissões: ${data.summary.total_emissions.toFixed(2)} tCO₂e
Tendência: ${data.summary.trend.toFixed(1)}%

DISTRIBUIÇÃO POR ESCOPO:
- Escopo 1: ${data.summary.scope1_percentage.toFixed(1)}%
- Escopo 2: ${data.summary.scope2_percentage.toFixed(1)}%
- Escopo 3: ${data.summary.scope3_percentage.toFixed(1)}%

PRINCIPAIS INSIGHTS:
${data.insights.map(insight => `• ${insight}`).join('\n')}

RECOMENDAÇÕES:
${data.recommendations.map(rec => `• ${rec.title}: ${rec.description}`).join('\n')}
  `;

  return new Blob([pdfContent], { type: 'application/pdf' });
}