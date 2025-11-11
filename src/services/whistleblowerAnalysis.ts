import { supabase } from "@/integrations/supabase/client";
import { WHISTLEBLOWER_BENCHMARKS } from "@/data/whistleblowerBenchmarks";

export interface WhistleblowerAnalysisResult {
  // Totais gerais
  total_reports: number;
  total_reports_current_year: number;
  open_reports: number;
  closed_reports: number;
  anonymous_reports: number;
  anonymous_percentage: number;
  
  // Status breakdown
  by_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  
  // Categoria breakdown
  by_category: Array<{
    category: string;
    count: number;
    percentage: number;
    avg_resolution_days: number;
    critical_count: number;
  }>;
  
  // Prioridade breakdown
  by_priority: Array<{
    priority: string;
    count: number;
    percentage: number;
    avg_resolution_days: number;
  }>;
  
  // Análise temporal (últimos 12 meses)
  monthly_trend: Array<{
    month: string;
    reports_received: number;
    reports_resolved: number;
    reports_opened: number;
    reports_closed: number;
    avg_resolution_days: number;
  }>;
  
  // Métricas de resolução
  resolution_metrics: {
    resolution_rate: number;
    avg_resolution_time_days: number;
    median_resolution_time_days: number;
    reports_overdue: number;
    reports_under_30_days: number;
    reports_30_90_days: number;
    reports_over_90_days: number;
  };
  
  // Comparação com período anterior
  comparison: {
    previous_period_total: number;
    change_percentage: number;
    is_improving: boolean;
    previous_resolution_rate: number;
    resolution_rate_change: number;
  };
  
  // Top 5 categorias
  top_5_categories: Array<{
    category: string;
    count: number;
    percentage_of_total: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  
  // Análise de reincidência
  recurrence_analysis: {
    categories_with_recurrence: Array<{
      category: string;
      count: number;
      is_systemic: boolean;
    }>;
    systemic_issues_count: number;
  };
  
  // Classificação de desempenho
  performance_classification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  
  // Compliance
  compliance_status: {
    has_whistleblower_channel: boolean;
    channel_utilization_rate: number;
    gri_2_26_compliant: boolean;
    iso_37001_compliant: boolean;
    missing_data: string[];
    recommendations: string[];
  };
  
  // Benchmarks setoriais
  sector_benchmark: {
    reports_per_100_employees: number;
    typical_resolution_time_days: number;
    typical_resolution_rate: number;
  };
  
  // Eficácia de Resolução (KPI dedicado)
  resolution_effectiveness: {
    total_resolved: number;
    total_received: number;
    target_resolution_rate: number;
    actual_resolution_rate: number;
    is_meeting_target: boolean;
    gap_to_target: number;
    resolved_under_30_days_percentage: number;
    resolved_with_action_taken: number;
    resolved_without_action: number;
    resolution_funnel: {
      received: number;
      under_investigation: number;
      awaiting_action: number;
      resolved: number;
      conversion_rate: number;
    };
    resolution_speed_score: number;
    backlog_trend: 'improving' | 'worsening' | 'stable';
    best_resolved_categories: Array<{
      category: string;
      resolution_rate: number;
      avg_resolution_days: number;
    }>;
    worst_resolved_categories: Array<{
      category: string;
      resolution_rate: number;
      avg_resolution_days: number;
    }>;
  };
  
  calculation_date: string;
}

export async function calculateWhistleblowerMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<WhistleblowerAnalysisResult> {
  // Buscar denúncias do período
  const { data: reports, error: reportsError } = await supabase
    .from('whistleblower_reports')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (reportsError) throw reportsError;

  // Buscar denúncias do período anterior (mesma duração)
  const periodDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
  const previousStart = new Date(new Date(startDate).getTime() - periodDuration).toISOString();
  const previousEnd = startDate;

  const { data: previousReports, error: prevError } = await supabase
    .from('whistleblower_reports')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', previousStart)
    .lte('created_at', previousEnd);

  if (prevError) throw prevError;

  // Buscar total de funcionários para taxa de utilização
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', companyId)
    .is('termination_date', null);

  if (empError) throw empError;

  const totalEmployees = employees?.length || 0;

  // Processar dados
  const totalReports = reports?.length || 0;
  const closedStatuses = ['Resolvida', 'Fechada', 'Arquivada'];
  const closedReports = reports?.filter(r => closedStatuses.includes(r.status)) || [];
  const openReports = reports?.filter(r => !closedStatuses.includes(r.status)) || [];
  const anonymousReports = reports?.filter(r => r.is_anonymous) || [];

  // Calcular denúncias do ano corrente
  const currentYear = new Date().getFullYear();
  const currentYearReports = reports?.filter(r => 
    new Date(r.created_at).getFullYear() === currentYear
  ) || [];

  // Breakdown por status
  const statusCounts = reports?.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: (count / totalReports) * 100
  }));

  // Breakdown por categoria
  const categoryData = reports?.reduce((acc, r) => {
    if (!acc[r.category]) {
      acc[r.category] = { 
        count: 0, 
        totalResolutionDays: 0, 
        resolvedCount: 0,
        criticalCount: 0
      };
    }
    acc[r.category].count++;
    
    if (r.priority === 'Crítica') {
      acc[r.category].criticalCount++;
    }
    
    if (r.closed_at) {
      const resolutionDays = Math.floor(
        (new Date(r.closed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      acc[r.category].totalResolutionDays += resolutionDays;
      acc[r.category].resolvedCount++;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const byCategory = Object.entries(categoryData).map(([category, data]) => ({
    category,
    count: data.count,
    percentage: (data.count / totalReports) * 100,
    avg_resolution_days: data.resolvedCount > 0 
      ? data.totalResolutionDays / data.resolvedCount 
      : 0,
    critical_count: data.criticalCount
  }));

  // Breakdown por prioridade
  const priorityData = reports?.reduce((acc, r) => {
    if (!acc[r.priority]) {
      acc[r.priority] = { count: 0, totalResolutionDays: 0, resolvedCount: 0 };
    }
    acc[r.priority].count++;
    
    if (r.closed_at) {
      const resolutionDays = Math.floor(
        (new Date(r.closed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      acc[r.priority].totalResolutionDays += resolutionDays;
      acc[r.priority].resolvedCount++;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const byPriority = Object.entries(priorityData).map(([priority, data]) => ({
    priority,
    count: data.count,
    percentage: (data.count / totalReports) * 100,
    avg_resolution_days: data.resolvedCount > 0 
      ? data.totalResolutionDays / data.resolvedCount 
      : 0
  }));

  // Tendência mensal (últimos 12 meses)
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const monthStr = date.toISOString().slice(0, 7);
    
    const monthReports = reports?.filter(r => 
      r.created_at.startsWith(monthStr)
    ) || [];
    
    const monthResolved = monthReports.filter(r => 
      r.closed_at && r.closed_at.startsWith(monthStr)
    );
    
    const avgResolutionDays = monthResolved.length > 0
      ? monthResolved.reduce((sum, r) => {
          const days = Math.floor(
            (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / monthResolved.length
      : 0;
    
    return {
      month: monthStr,
      reports_received: monthReports.length,
      reports_resolved: monthResolved.length,
      reports_opened: monthReports.filter(r => !closedStatuses.includes(r.status)).length,
      reports_closed: monthResolved.length,
      avg_resolution_days: avgResolutionDays
    };
  });

  // Métricas de resolução
  const resolutionTimes = closedReports
    .map(r => Math.floor(
      (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    ))
    .sort((a, b) => a - b);

  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, days) => sum + days, 0) / resolutionTimes.length
    : 0;

  const medianResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes[Math.floor(resolutionTimes.length / 2)]
    : 0;

  const reportsOverdue = openReports.filter(r => {
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation > 90;
  }).length;

  const reportsUnder30 = closedReports.filter(r => {
    const days = Math.floor(
      (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days < 30;
  }).length;

  const reports30to90 = closedReports.filter(r => {
    const days = Math.floor(
      (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days >= 30 && days <= 90;
  }).length;

  const reportsOver90 = closedReports.filter(r => {
    const days = Math.floor(
      (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 90;
  }).length;

  const resolutionRate = totalReports > 0
    ? (closedReports.length / totalReports) * 100
    : 0;

  // Comparação com período anterior
  const previousTotal = previousReports?.length || 0;
  const previousClosed = previousReports?.filter(r => closedStatuses.includes(r.status)) || [];
  const previousResolutionRate = previousTotal > 0
    ? (previousClosed.length / previousTotal) * 100
    : 0;

  const changePercentage = previousTotal > 0
    ? ((totalReports - previousTotal) / previousTotal) * 100
    : 0;

  const resolutionRateChange = previousResolutionRate > 0
    ? resolutionRate - previousResolutionRate
    : 0;

  const isImproving = totalReports < previousTotal || resolutionRate > previousResolutionRate;

  // Top 5 categorias
  const top5Categories = byCategory
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(cat => {
      const previousCategoryCount = previousReports?.filter(r => r.category === cat.category).length || 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (previousCategoryCount > 0) {
        const catChange = ((cat.count - previousCategoryCount) / previousCategoryCount) * 100;
        if (catChange > 10) trend = 'increasing';
        else if (catChange < -10) trend = 'decreasing';
      }
      
      return {
        category: cat.category,
        count: cat.count,
        percentage_of_total: cat.percentage,
        trend
      };
    });

  // Análise de reincidência (problemas sistêmicos)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentReports = reports?.filter(r => 
    new Date(r.created_at) >= sixMonthsAgo
  ) || [];

  const categoryCounts = recentReports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const systemicIssues = Object.entries(categoryCounts)
    .filter(([_, count]) => count >= 3)
    .map(([category, count]) => ({
      category,
      count,
      is_systemic: true
    }));

  // Classificação de desempenho
  let performanceClassification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  
  if (resolutionRate >= 90 && avgResolutionTime <= 30) {
    performanceClassification = 'Excelente';
  } else if (resolutionRate >= 80 && avgResolutionTime <= 60) {
    performanceClassification = 'Bom';
  } else if (resolutionRate >= 60 || avgResolutionTime <= 90) {
    performanceClassification = 'Atenção';
  } else {
    performanceClassification = 'Crítico';
  }

  // Compliance
  const hasWhistleblowerChannel = true; // Sistema existe
  const channelUtilizationRate = totalEmployees > 0
    ? (totalReports / totalEmployees) * 100
    : 0;

  const missingData: string[] = [];
  const recommendations: string[] = [];

  // GRI 2-26 compliance
  const gri_2_26_compliant = totalReports > 0 && byCategory.length > 0;
  if (!gri_2_26_compliant) {
    missingData.push('Dados insuficientes sobre denúncias e categorias');
    recommendations.push('Preencher categoria e status de todas as denúncias');
  }

  // ISO 37001 compliance
  const iso_37001_compliant = resolutionRate >= 70 && avgResolutionTime <= 90;
  if (!iso_37001_compliant) {
    if (resolutionRate < 70) {
      missingData.push('Taxa de resolução abaixo de 70%');
      recommendations.push('Melhorar processos de investigação para aumentar taxa de resolução');
    }
    if (avgResolutionTime > 90) {
      missingData.push('Tempo médio de resolução acima de 90 dias');
      recommendations.push('Agilizar investigações para resolver denúncias em até 90 dias');
    }
  }

  if (reportsOverdue > 0) {
    recommendations.push(`${reportsOverdue} denúncias abertas há mais de 90 dias precisam de atenção urgente`);
  }

  if (systemicIssues.length > 0) {
    recommendations.push('Implementar ações corretivas estruturais para problemas sistêmicos identificados');
  }

  // Benchmarks setoriais (usando setor padrão)
  const sectorBenchmark = WHISTLEBLOWER_BENCHMARKS['Default'];

  // === EFICÁCIA DE RESOLUÇÃO (KPI DEDICADO) ===
  
  // Meta de resolução
  const targetResolutionRate = 85;
  const gapToTarget = targetResolutionRate - resolutionRate;
  const isMeetingTarget = resolutionRate >= targetResolutionRate;
  
  // Qualidade de resolução
  const resolvedUnder30DaysPercentage = closedReports.length > 0
    ? (reportsUnder30 / closedReports.length) * 100
    : 0;
  
  // Denúncias com ação corretiva (assumindo que denúncias com status "Resolvida" tiveram ação)
  const resolvedWithActionTaken = reports?.filter(r => r.status === 'Resolvida').length || 0;
  const resolvedWithoutAction = reports?.filter(r => r.status === 'Arquivada').length || 0;
  
  // Funil de resolução
  const underInvestigation = reports?.filter(r => r.status === 'Em Investigação').length || 0;
  const awaitingAction = reports?.filter(r => r.status === 'Aguardando Ação').length || 0;
  
  const resolutionFunnel = {
    received: totalReports,
    under_investigation: underInvestigation,
    awaiting_action: awaitingAction,
    resolved: closedReports.length,
    conversion_rate: totalReports > 0 ? (closedReports.length / totalReports) * 100 : 0
  };
  
  // Score de velocidade (0-100)
  const resolutionSpeedScore = Math.min(100, resolvedUnder30DaysPercentage * 1.5);
  
  // Tendência do backlog
  const previousOpenReports = previousReports?.filter(r => !closedStatuses.includes(r.status)).length || 0;
  let backlogTrend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (openReports.length < previousOpenReports) {
    backlogTrend = 'improving';
  } else if (openReports.length > previousOpenReports) {
    backlogTrend = 'worsening';
  }
  
  // Categorias com melhor/pior resolução
  const categoriesWithResolution = byCategory
    .filter(cat => cat.count >= 2) // Pelo menos 2 denúncias para ser estatisticamente relevante
    .map(cat => {
      const categoryReports = reports?.filter(r => r.category === cat.category) || [];
      const categoryResolved = categoryReports.filter(r => closedStatuses.includes(r.status));
      const categoryResolutionRate = categoryReports.length > 0 
        ? (categoryResolved.length / categoryReports.length) * 100 
        : 0;
      
      return {
        category: cat.category,
        resolution_rate: categoryResolutionRate,
        avg_resolution_days: cat.avg_resolution_days
      };
    })
    .sort((a, b) => b.resolution_rate - a.resolution_rate);
  
  const bestResolvedCategories = categoriesWithResolution.slice(0, 3);
  const worstResolvedCategories = categoriesWithResolution.slice(-3).reverse();

  return {
    total_reports: totalReports,
    total_reports_current_year: currentYearReports.length,
    open_reports: openReports.length,
    closed_reports: closedReports.length,
    anonymous_reports: anonymousReports.length,
    anonymous_percentage: totalReports > 0 ? (anonymousReports.length / totalReports) * 100 : 0,
    by_status: byStatus,
    by_category: byCategory,
    by_priority: byPriority,
    monthly_trend: monthlyTrend,
    resolution_metrics: {
      resolution_rate: resolutionRate,
      avg_resolution_time_days: avgResolutionTime,
      median_resolution_time_days: medianResolutionTime,
      reports_overdue: reportsOverdue,
      reports_under_30_days: reportsUnder30,
      reports_30_90_days: reports30to90,
      reports_over_90_days: reportsOver90
    },
    comparison: {
      previous_period_total: previousTotal,
      change_percentage: changePercentage,
      is_improving: isImproving,
      previous_resolution_rate: previousResolutionRate,
      resolution_rate_change: resolutionRateChange
    },
    top_5_categories: top5Categories,
    recurrence_analysis: {
      categories_with_recurrence: systemicIssues,
      systemic_issues_count: systemicIssues.length
    },
    performance_classification: performanceClassification,
    compliance_status: {
      has_whistleblower_channel: hasWhistleblowerChannel,
      channel_utilization_rate: channelUtilizationRate,
      gri_2_26_compliant: gri_2_26_compliant,
      iso_37001_compliant: iso_37001_compliant,
      missing_data: missingData,
      recommendations: recommendations
    },
    sector_benchmark: {
      reports_per_100_employees: sectorBenchmark.reports_per_100_employees_typical,
      typical_resolution_time_days: sectorBenchmark.typical_resolution_time_days,
      typical_resolution_rate: sectorBenchmark.typical_resolution_rate
    },
    resolution_effectiveness: {
      total_resolved: closedReports.length,
      total_received: totalReports,
      target_resolution_rate: targetResolutionRate,
      actual_resolution_rate: resolutionRate,
      is_meeting_target: isMeetingTarget,
      gap_to_target: gapToTarget,
      resolved_under_30_days_percentage: resolvedUnder30DaysPercentage,
      resolved_with_action_taken: resolvedWithActionTaken,
      resolved_without_action: resolvedWithoutAction,
      resolution_funnel: resolutionFunnel,
      resolution_speed_score: resolutionSpeedScore,
      backlog_trend: backlogTrend,
      best_resolved_categories: bestResolvedCategories,
      worst_resolved_categories: worstResolvedCategories
    },
    calculation_date: new Date().toISOString()
  };
}
