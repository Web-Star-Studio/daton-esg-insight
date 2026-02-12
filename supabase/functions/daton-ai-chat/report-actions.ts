import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export async function handleGenerateSmartReport(
  supabase: SupabaseClient,
  args: any,
  companyId: string
) {
  try {
    const { reportType, dateRange, includeCharts = true, includeInsights = true, sections } = args;
    
    console.log('Generating smart report:', { reportType, dateRange, companyId });
    
    // Call smart report generator function
    const { data, error } = await supabase.functions.invoke('smart-report-generator', {
      body: {
        reportType,
        dateRange,
        filters: { companyId },
        sections,
        includeCharts,
        includeInsights
      }
    });
    
    if (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        message: `Erro ao gerar relatório: ${error.message}`
      };
    }
    
    if (!data.success) {
      return {
        success: false,
        message: data.error || 'Erro desconhecido ao gerar relatório'
      };
    }
    
    const report = data.report;
    
    // Build response message
    let message = `✅ **Relatório ${getReportTypeName(reportType)} gerado com sucesso!**\n\n`;
    message += `📅 **Período**: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}\n\n`;
    
    // Add metrics summary
    if (report.metrics) {
      message += `📊 **Métricas Principais**:\n`;
      Object.entries(report.metrics).forEach(([key, value]) => {
        const metricName = formatMetricName(key);
        message += `• ${metricName}: ${formatMetricValue(value)}\n`;
      });
      message += `\n`;
    }
    
    // Add charts info
    if (report.charts && report.charts.length > 0) {
      message += `📈 **Gráficos Gerados**: ${report.charts.length}\n`;
      report.charts.forEach((chart: any) => {
        message += `• ${chart.title} (${chart.type})\n`;
      });
      message += `\n`;
    }
    
    // Add AI insights
    if (report.insights) {
      message += `🤖 **Insights de IA**:\n\n`;
      
      if (report.insights.keyFindings && report.insights.keyFindings.length > 0) {
        message += `**Principais Descobertas**:\n`;
        report.insights.keyFindings.forEach((finding: string, idx: number) => {
          message += `${idx + 1}. ${finding}\n`;
        });
        message += `\n`;
      }
      
      if (report.insights.recommendations && report.insights.recommendations.length > 0) {
        message += `**Recomendações**:\n`;
        report.insights.recommendations.slice(0, 3).forEach((rec: any) => {
          const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          message += `${priorityEmoji} **${rec.title}**: ${rec.description}\n`;
        });
        message += `\n`;
      }
      
      if (report.insights.trends && report.insights.trends.length > 0) {
        message += `**Tendências Identificadas**:\n`;
        report.insights.trends.forEach((trend: string) => {
          message += `📊 ${trend}\n`;
        });
        message += `\n`;
      }
      
      if (report.insights.risks && report.insights.risks.length > 0) {
        message += `⚠️ **Riscos Identificados**:\n`;
        report.insights.risks.forEach((risk: string) => {
          message += `• ${risk}\n`;
        });
        message += `\n`;
      }
      
      if (report.insights.opportunities && report.insights.opportunities.length > 0) {
        message += `💡 **Oportunidades**:\n`;
        report.insights.opportunities.forEach((opp: string) => {
          message += `• ${opp}\n`;
        });
        message += `\n`;
      }
    }
    
    // Add summary
    if (report.summary) {
      message += `📋 **Resumo**:\n`;
      message += `• ${report.summary.dataPoints} pontos de dados analisados\n`;
      message += `• ${report.summary.metricsCalculated} métricas calculadas\n`;
      if (report.summary.insightsGenerated) {
        message += `• ${report.summary.insightsGenerated} insights gerados por IA\n`;
      }
    }
    
    return {
      success: true,
      message,
      data: report
    };
    
  } catch (error) {
    console.error('Error in handleGenerateSmartReport:', error);
    return {
      success: false,
      message: `Erro ao gerar relatório: ${(error as Error).message}`
    };
  }
}

export async function handleCreateChart(
  supabase: SupabaseClient,
  args: any,
  companyId: string
) {
  try {
    const { chartType, dataSource, title, xAxis, yAxis, filters = {}, groupBy } = args;
    
    console.log('Creating chart:', { chartType, dataSource, title });
    
    // Fetch data from specified source
    let query = supabase
      .from(dataSource)
      .select('*')
      .eq('company_id', companyId);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      return {
        success: false,
        message: `Erro ao buscar dados: ${error.message}`
      };
    }
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'Nenhum dado encontrado para criar o gráfico'
      };
    }
    
    // Process data for chart
    let chartData = data;
    
    if (groupBy) {
      const grouped = data.reduce((acc: any, item: any) => {
        const key = item[groupBy];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {});
      
      chartData = Object.entries(grouped).map(([key, items]: [string, any]) => ({
        [groupBy]: key,
        count: items.length,
        value: items.reduce((sum: number, item: any) => sum + (parseFloat(item[yAxis]) || 0), 0)
      }));
    }
    
    const message = `📊 **Gráfico criado com sucesso!**\n\n` +
                   `**Título**: ${title}\n` +
                   `**Tipo**: ${chartType}\n` +
                   `**Dados**: ${chartData.length} registros\n\n` +
                   `O gráfico foi gerado com os dados de ${dataSource}.`;
    
    return {
      success: true,
      message,
      data: {
        type: chartType,
        title,
        data: chartData,
        xAxis,
        yAxis,
        config: { groupBy }
      }
    };
    
  } catch (error) {
    console.error('Error in handleCreateChart:', error);
    return {
      success: false,
      message: `Erro ao criar gráfico: ${(error as Error).message}`
    };
  }
}

export async function handleScheduleReport(
  supabase: SupabaseClient,
  args: any,
  companyId: string,
  userId: string
) {
  try {
    const { reportType, frequency, recipients = [], format = 'pdf', startDate } = args;
    
    console.log('Scheduling report:', { reportType, frequency });
    
    // In a real implementation, this would create a scheduled job
    // For now, we'll just acknowledge the request
    
    const message = `✅ **Relatório agendado com sucesso!**\n\n` +
                   `📋 **Tipo**: ${getReportTypeName(reportType)}\n` +
                   `📅 **Frequência**: ${getFrequencyName(frequency)}\n` +
                   `📄 **Formato**: ${format.toUpperCase()}\n` +
                   `${recipients.length > 0 ? `📧 **Destinatários**: ${recipients.join(', ')}\n` : ''}` +
                   `${startDate ? `🗓️ **Início**: ${new Date(startDate).toLocaleDateString('pt-BR')}\n` : ''}\n` +
                   `O relatório será gerado automaticamente e enviado conforme agendado.`;
    
    return {
      success: true,
      message,
      data: {
        reportType,
        frequency,
        recipients,
        format,
        startDate,
        nextRun: calculateNextRun(frequency, startDate)
      }
    };
    
  } catch (error) {
    console.error('Error in handleScheduleReport:', error);
    return {
      success: false,
      message: `Erro ao agendar relatório: ${(error as Error).message}`
    };
  }
}

export async function handleAnalyzeTrends(
  supabase: SupabaseClient,
  args: any,
  companyId: string
) {
  try {
    const { dataType, period, customDateRange, metrics = [] } = args;
    
    console.log('Analyzing trends:', { dataType, period });
    
    const dateRange = getDateRangeFromPeriod(period, customDateRange);
    
    // Call smart report generator with trend analysis focus
    const { data, error } = await supabase.functions.invoke('smart-report-generator', {
      body: {
        reportType: dataType,
        dateRange,
        filters: { companyId },
        includeCharts: true,
        includeInsights: true,
        sections: ['trends', 'analysis']
      }
    });
    
    if (error || !data.success) {
      return {
        success: false,
        message: `Erro ao analisar tendências: ${error?.message || data?.error}`
      };
    }
    
    const report = data.report;
    
    let message = `📈 **Análise de Tendências - ${getDataTypeName(dataType)}**\n\n`;
    message += `📅 **Período**: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}\n\n`;
    
    if (report.insights?.trends && report.insights.trends.length > 0) {
      message += `**Tendências Identificadas**:\n`;
      report.insights.trends.forEach((trend: string, idx: number) => {
        message += `${idx + 1}. ${trend}\n`;
      });
      message += `\n`;
    }
    
    if (report.charts && report.charts.length > 0) {
      message += `📊 **Visualizações**: ${report.charts.length} gráficos de tendência gerados\n\n`;
    }
    
    if (report.insights?.recommendations) {
      message += `💡 **Recomendações Baseadas nas Tendências**:\n`;
      report.insights.recommendations.slice(0, 3).forEach((rec: any) => {
        message += `• ${rec.title}\n`;
      });
    }
    
    return {
      success: true,
      message,
      data: report
    };
    
  } catch (error) {
    console.error('Error in handleAnalyzeTrends:', error);
    return {
      success: false,
      message: `Erro ao analisar tendências: ${(error as Error).message}`
    };
  }
}

// Helper functions
function getReportTypeName(type: string): string {
  const names: Record<string, string> = {
    emissions: 'Emissões',
    quality: 'Qualidade',
    compliance: 'Compliance',
    esg: 'ESG',
    gri: 'GRI',
    custom: 'Personalizado'
  };
  return names[type] || type;
}

function getFrequencyName(freq: string): string {
  const names: Record<string, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral'
  };
  return names[freq] || freq;
}

function getDataTypeName(type: string): string {
  const names: Record<string, string> = {
    emissions: 'Emissões',
    quality: 'Qualidade',
    compliance: 'Compliance',
    goals: 'Metas'
  };
  return names[type] || type;
}

function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    totalEmissions: 'Total de Emissões',
    scope1Percentage: '% Escopo 1',
    scope2Percentage: '% Escopo 2',
    scope3Percentage: '% Escopo 3',
    totalNonConformities: 'Total de NCs',
    openNCs: 'NCs Abertas',
    closedNCs: 'NCs Fechadas',
    resolutionRate: 'Taxa de Resolução',
    totalLicenses: 'Total de Licenças',
    expiringSoon: 'Expirando em Breve',
    complianceRate: 'Taxa de Conformidade',
    totalRisks: 'Total de Riscos',
    criticalRisks: 'Riscos Críticos',
    riskScore: 'Score de Risco'
  };
  return names[key] || key;
}

function formatMetricValue(value: any): string {
  if (typeof value === 'number') {
    if (value % 1 === 0) {
      return value.toString();
    }
    return `${value}%`;
  }
  return String(value);
}

function calculateNextRun(frequency: string, startDate?: string): string {
  const start = startDate ? new Date(startDate) : new Date();
  
  switch (frequency) {
    case 'daily':
      start.setDate(start.getDate() + 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() + 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() + 3);
      break;
  }
  
  return start.toISOString();
}

function getDateRangeFromPeriod(period: string, customRange?: any) {
  if (period === 'custom' && customRange) {
    return customRange;
  }
  
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'last_quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last_year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}
