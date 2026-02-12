/**
 * Tool Executors - Implement the actual data queries
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { 
  analyzeTrends, 
  comparePeriods, 
  predictFutureMetrics, 
  analyzeCorrelations, 
  generateExecutiveSummary 
} from './advanced-analytics.ts';
import {
  analyzeComplianceGaps,
  benchmarkPerformance,
  identifyOptimizationOpportunities,
  analyzeStakeholderImpact
} from './advanced-tool-executors.ts';
import {
  queryAccountingEntries,
  queryAccountsPayable,
  queryAccountsReceivable,
  calculateFinancialRatios,
  predictCashFlow,
  analyzeESGFinancialImpact,
  queryBankAccounts,
  analyzeFinancialTrends
} from './financial-tool-executors.ts';
import { getComprehensiveCompanyData } from './comprehensive-data.ts';

export async function executeReadTool(
  toolName: string,
  args: any,
  companyId: string,
  supabaseClient: any
): Promise<any> {
  console.log(`Executing read tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'get_comprehensive_company_data':
        console.log('📊 Fetching comprehensive company data...');
        const comprehensiveData = await getComprehensiveCompanyData(
          companyId,
          supabaseClient,
          args
        );
        return {
          success: true,
          data: comprehensiveData,
          message: `Dados completos carregados: ${Object.keys(comprehensiveData.data).length} categorias`
        };
        
      case 'query_emissions_data':
        return await queryEmissionsData(args, companyId, supabaseClient);
      
      case 'query_goals_progress':
        return await queryGoalsProgress(args, companyId, supabaseClient);
      
      case 'query_licenses':
        return await queryLicenses(args, companyId, supabaseClient);
      
      case 'query_tasks':
        return await queryTasks(args, companyId, supabaseClient);
      
      case 'query_risks':
        return await queryRisks(args, companyId, supabaseClient);
      
      case 'query_non_conformities':
        return await queryNonConformities(args, companyId, supabaseClient);
      
      case 'query_employees':
        return await queryEmployees(args, companyId, supabaseClient);
      
      case 'get_dashboard_summary':
        return await getDashboardSummary(args, companyId, supabaseClient);
      
      case 'review_pending_extractions':
        return await reviewPendingExtractions(args, companyId, supabaseClient);
      
      // Advanced Analytics Tools
      case 'analyze_trends':
        return await analyzeTrends(args.metric, args.period, args.groupBy || 'month', companyId, supabaseClient);
      
      case 'compare_periods':
        return await comparePeriods(args.metric, args.currentPeriod, args.previousPeriod, companyId, supabaseClient);
      
      case 'predict_future_metrics':
        return await predictFutureMetrics(args.metric, args.forecastPeriod, args.includeConfidence || false, companyId, supabaseClient);
      
      case 'analyze_correlations':
        return await analyzeCorrelations(args.metrics, args.period || 'last_6_months', companyId, supabaseClient);
      
      case 'generate_executive_summary':
        return await generateExecutiveSummary(args.scope, args.includeRecommendations || true, args.priorityLevel || 'all', companyId, supabaseClient);
      
      case 'analyze_compliance_gaps':
        return await analyzeComplianceGaps(args, companyId, supabaseClient);
      
      case 'benchmark_performance':
        return await benchmarkPerformance(args, companyId, supabaseClient);
      
      case 'identify_optimization_opportunities':
        return await identifyOptimizationOpportunities(args, companyId, supabaseClient);
      
      case 'analyze_stakeholder_impact':
        return await analyzeStakeholderImpact(args, companyId, supabaseClient);
      
      // Financial Tools
      case 'query_accounting_entries':
        return await queryAccountingEntries(args, companyId, supabaseClient);
      
      case 'query_accounts_payable':
        return await queryAccountsPayable(args, companyId, supabaseClient);
      
      case 'query_accounts_receivable':
        return await queryAccountsReceivable(args, companyId, supabaseClient);
      
      case 'calculate_financial_ratios':
        return await calculateFinancialRatios(args, companyId, supabaseClient);
      
      case 'predict_cash_flow':
        return await predictCashFlow(args, companyId, supabaseClient);
      
      case 'analyze_esg_financial_impact':
        return await analyzeESGFinancialImpact(args, companyId, supabaseClient);
      
      case 'query_bank_accounts':
        return await queryBankAccounts(args, companyId, supabaseClient);
      
      case 'analyze_financial_trends':
        return await analyzeFinancialTrends(args, companyId, supabaseClient);
      
      // New expanded tools
      case 'global_search':
        return await globalSearch(args, companyId, supabaseClient);
      
      case 'query_documents':
        return await queryDocuments(args, companyId, supabaseClient);
      
      case 'query_gri_reports':
        return await queryGriReports(args, companyId, supabaseClient);
      
      case 'query_suppliers':
        return await querySuppliers(args, companyId, supabaseClient);
      
      case 'query_trainings':
        return await queryTrainings(args, companyId, supabaseClient);
      
      case 'query_audits':
        return await queryAudits(args, companyId, supabaseClient);
      
      case 'query_okrs':
        return await queryOkrs(args, companyId, supabaseClient);
      
      case 'query_projects':
        return await queryProjects(args, companyId, supabaseClient);
      
      case 'query_waste_data':
        return await queryWasteData(args, companyId, supabaseClient);
      
      case 'query_indicators':
        return await queryIndicators(args, companyId, supabaseClient);
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: (error as Error).message };
  }
}

async function queryEmissionsData(args: any, companyId: string, supabase: any) {
  const { scope, year = new Date().getFullYear(), groupBy } = args;
  
  let query = supabase
    .from('calculated_emissions')
    .select(`
      *,
      activity_data:activity_data_id(
        *,
        emission_source:emission_source_id(*)
      )
    `)
    .eq('activity_data.emission_source.company_id', companyId);

  if (scope !== 'all') {
    query = query.eq('activity_data.emission_source.scope', parseInt(scope));
  }

  const { data, error } = await query;
  
  if (error) throw error;

  // Process and group data
  let result = {
    totalEmissions: 0,
    count: 0,
    breakdown: {}
  };

  data?.forEach((emission: any) => {
    result.totalEmissions += emission.total_co2e || 0;
    result.count++;
  });

  return {
    success: true,
    data: result,
    message: `Encontradas ${result.count} registros de emissões com total de ${result.totalEmissions.toFixed(2)} tCO2e`
  };
}

async function queryGoalsProgress(args: any, companyId: string, supabase: any) {
  const { status, category, sortBy } = args;

  let query = supabase
    .from('goals')
    .select('*')
    .eq('company_id', companyId);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const summary = {
    total: data?.length || 0,
    byStatus: {},
    avgProgress: 0
  };

  data?.forEach((goal: any) => {
    summary.byStatus[goal.status] = (summary.byStatus[goal.status] || 0) + 1;
    summary.avgProgress += goal.progress_percentage || 0;
  });

  if (summary.total > 0) {
    summary.avgProgress = summary.avgProgress / summary.total;
  }

  return {
    success: true,
    data: summary,
    goals: data,
    message: `Encontradas ${summary.total} metas com progresso médio de ${summary.avgProgress.toFixed(1)}%`
  };
}

async function queryLicenses(args: any, companyId: string, supabase: any) {
  const { status, daysUntilExpiry = 30 } = args;

  let query = supabase
    .from('licenses')
    .select('*')
    .eq('company_id', companyId);

  if (status === 'active') {
    query = query.eq('status', 'Ativa');
  } else if (status === 'expired') {
    query = query.eq('status', 'Vencida');
  } else if (status === 'expiring_soon') {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);
    query = query
      .lte('expiration_date', futureDate.toISOString())
      .eq('status', 'Ativa');
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    success: true,
    data: data,
    count: data?.length || 0,
    message: `Encontradas ${data?.length || 0} licenças`
  };
}

async function queryTasks(args: any, companyId: string, supabase: any) {
  const { status, taskType, assignedTo } = args;

  let query = supabase
    .from('data_collection_tasks')
    .select('*')
    .eq('company_id', companyId);

  if (status === 'pending') {
    query = query.eq('status', 'Pendente');
  } else if (status === 'overdue') {
    query = query.eq('status', 'Em Atraso');
  } else if (status === 'completed') {
    query = query.eq('status', 'Concluída');
  }

  if (taskType) {
    query = query.eq('task_type', taskType);
  }

  if (assignedTo) {
    query = query.eq('assigned_to_user_id', assignedTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    success: true,
    data: data,
    count: data?.length || 0,
    message: `Encontradas ${data?.length || 0} tarefas`
  };
}

async function queryRisks(args: any, companyId: string, supabase: any) {
  const { level, category, status } = args;

  let query = supabase
    .from('esg_risks')
    .select('*')
    .eq('company_id', companyId);

  if (level && level !== 'all') {
    query = query.eq('inherent_risk_level', level === 'critical' ? 'Crítico' : level);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status === 'active' ? 'Ativo' : 'Mitigado');
  }

  const { data, error } = await query;
  if (error) throw error;

  const summary = {
    total: data?.length || 0,
    byLevel: {},
    critical: 0
  };

  data?.forEach((risk: any) => {
    summary.byLevel[risk.inherent_risk_level] = (summary.byLevel[risk.inherent_risk_level] || 0) + 1;
    if (risk.inherent_risk_level === 'Crítico') summary.critical++;
  });

  return {
    success: true,
    data: summary,
    risks: data,
    message: `Encontrados ${summary.total} riscos, sendo ${summary.critical} críticos`
  };
}

async function queryNonConformities(args: any, companyId: string, supabase: any) {
  const { status, severity } = args;

  let query = supabase
    .from('non_conformities')
    .select('*')
    .eq('company_id', companyId);

  if (status && status !== 'all') {
    if (status === 'open') query = query.eq('status', 'Aberta');
    if (status === 'in_treatment') query = query.eq('status', 'Em Tratamento');
    if (status === 'closed') query = query.eq('status', 'Fechada');
  }

  if (severity && severity !== 'all') {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    success: true,
    data: data,
    count: data?.length || 0,
    message: `Encontradas ${data?.length || 0} não conformidades`
  };
}

async function queryEmployees(args: any, companyId: string, supabase: any) {
  const { status, groupBy } = args;

  let query = supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId);

  if (status && status !== 'all') {
    query = query.eq('status', status === 'active' ? 'Ativo' : 'Inativo');
  }

  const { data, error } = await query;
  if (error) throw error;

  const summary = {
    total: data?.length || 0,
    byGender: {},
    byDepartment: {}
  };

  data?.forEach((emp: any) => {
    if (emp.gender) {
      summary.byGender[emp.gender] = (summary.byGender[emp.gender] || 0) + 1;
    }
    if (emp.department) {
      summary.byDepartment[emp.department] = (summary.byDepartment[emp.department] || 0) + 1;
    }
  });

  return {
    success: true,
    data: summary,
    message: `Total de ${summary.total} colaboradores`
  };
}

async function getDashboardSummary(args: any, companyId: string, supabase: any) {
  const { includeAlerts = true } = args;

  // Get key metrics from various tables
  const [
    { data: goals },
    { data: tasks },
    { data: licenses },
    { data: risks },
    { data: emissions }
  ] = await Promise.all([
    supabase.from('goals').select('status').eq('company_id', companyId),
    supabase.from('data_collection_tasks').select('status').eq('company_id', companyId),
    supabase.from('licenses').select('status, expiration_date').eq('company_id', companyId),
    supabase.from('esg_risks').select('inherent_risk_level').eq('company_id', companyId).eq('status', 'Ativo'),
    supabase.from('emission_sources').select('scope').eq('company_id', companyId)
  ]);

  const summary = {
    goals: {
      total: goals?.length || 0,
      active: goals?.filter(g => g.status === 'Em Andamento').length || 0
    },
    tasks: {
      total: tasks?.length || 0,
      overdue: tasks?.filter(t => t.status === 'Em Atraso').length || 0,
      pending: tasks?.filter(t => t.status === 'Pendente').length || 0
    },
    licenses: {
      total: licenses?.length || 0,
      active: licenses?.filter(l => l.status === 'Ativa').length || 0,
      expired: licenses?.filter(l => l.status === 'Vencida').length || 0
    },
    risks: {
      total: risks?.length || 0,
      critical: risks?.filter(r => r.inherent_risk_level === 'Crítico').length || 0
    },
    emissions: {
      sources: emissions?.length || 0
    }
  };

  const alerts = [];
  if (includeAlerts) {
    if (summary.tasks.overdue > 0) {
      alerts.push(`⚠️ ${summary.tasks.overdue} tarefas em atraso`);
    }
    if (summary.licenses.expired > 0) {
      alerts.push(`🚨 ${summary.licenses.expired} licenças vencidas`);
    }
    if (summary.risks.critical > 0) {
      alerts.push(`⚠️ ${summary.risks.critical} riscos críticos ativos`);
    }
  }

  return {
    success: true,
    data: summary,
    alerts,
    message: `Dashboard: ${summary.goals.total} metas, ${summary.tasks.pending} tarefas pendentes, ${summary.risks.critical} riscos críticos`
  };
}

async function reviewPendingExtractions(args: any, companyId: string, supabase: any) {
  const { limit = 10, minConfidence = 0 } = args;

  let query = supabase
    .from('extracted_data_preview')
    .select(`
      *,
      document_extraction_jobs (
        documents (
          file_name,
          file_type
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('validation_status', 'Pendente')
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  // Filter by confidence if specified
  const filtered = data?.filter((item: any) => {
    const avgConfidence = Object.values(item.confidence_scores || {})
      .reduce((sum: number, score: any) => sum + score, 0) / 
      (Object.keys(item.confidence_scores || {}).length || 1);
    return avgConfidence >= minConfidence;
  }) || [];

  // Format for AI response
  const formatted = filtered.map((item: any) => {
    const avgConfidence = Object.values(item.confidence_scores || {})
      .reduce((sum: number, score: any) => sum + score, 0) / 
      (Object.keys(item.confidence_scores || {}).length || 1);
    
    return {
      id: item.id,
      documento: item.document_extraction_jobs?.documents?.file_name || 'Desconhecido',
      tabela_destino: item.target_table,
      confianca_media: `${Math.round(avgConfidence * 100)}%`,
      campos_extraidos: Object.keys(item.extracted_fields || {}).length,
      data_extracao: new Date(item.created_at).toLocaleDateString('pt-BR')
    };
  });

  return {
    success: true,
    data: formatted,
    count: formatted.length,
    message: `Encontradas ${formatted.length} extrações pendentes de aprovação. Acesse /extracoes-documentos para revisar.`
  };
}

// ============ NEW EXPANDED QUERY FUNCTIONS ============

async function globalSearch(args: any, companyId: string, supabase: any) {
  const { query, limit = 20 } = args;
  
  try {
    const { data, error } = await supabase
      .rpc('search_across_tables', {
        search_query: query,
        user_company_id: companyId,
        result_limit: limit
      });
    
    if (error) throw error;
    
    return {
      success: true,
      results: data,
      total: data?.length || 0,
      query
    };
  } catch (error) {
    console.error('Global search error:', error);
    return { error: error.message };
  }
}

async function queryDocuments(args: any, companyId: string, supabase: any) {
  const { documentType, tags, searchTerm, recentOnly } = args;
  
  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId);
  
  if (documentType && documentType !== 'all') {
    query = query.eq('document_type', documentType);
  }
  
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }
  
  if (searchTerm) {
    query = query.or(`file_name.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
  }
  
  if (recentOnly) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    query = query.gte('upload_date', ninetyDaysAgo.toISOString());
  }
  
  const { data, error } = await query.order('upload_date', { ascending: false }).limit(50);
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    documents: data,
    total: data?.length || 0
  };
}

async function queryGriReports(args: any, companyId: string, supabase: any) {
  const { reportYear, status, includeIndicators } = args;
  
  let query = supabase
    .from('gri_reports')
    .select(includeIndicators ? '*, gri_indicator_data(*)' : '*')
    .eq('company_id', companyId);
  
  if (reportYear) {
    query = query.eq('report_year', reportYear);
  }
  
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('report_year', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    reports: data,
    total: data?.length || 0
  };
}

async function querySuppliers(args: any, companyId: string, supabase: any) {
  const { status, category, minRating } = args;
  
  let query = supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId);
  
  if (status && status !== 'all') {
    if (status === 'qualified') {
      query = query.eq('qualification_status', 'Qualificado');
    } else if (status === 'not_qualified') {
      query = query.eq('qualification_status', 'Não Qualificado');
    } else {
      query = query.eq('status', status === 'active' ? 'Ativo' : 'Inativo');
    }
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (minRating) {
    query = query.gte('rating', minRating);
  }
  
  const { data, error } = await query.order('rating', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    suppliers: data,
    total: data?.length || 0,
    averageRating: data && data.length > 0 
      ? (data.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / data.length).toFixed(2)
      : 0
  };
}

async function queryTrainings(args: any, companyId: string, supabase: any) {
  const { status, category, mandatory } = args;
  
  let query = supabase
    .from('training_programs')
    .select(`
      *,
      course_enrollments(count)
    `)
    .eq('company_id', companyId);
  
  if (status && status !== 'all') {
    query = query.eq('status', status === 'active' ? 'Ativo' : status === 'completed' ? 'Concluído' : 'Agendado');
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (mandatory !== undefined) {
    query = query.eq('is_mandatory', mandatory);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    trainings: data,
    total: data?.length || 0
  };
}

async function queryAudits(args: any, companyId: string, supabase: any) {
  const { auditType, status, year } = args;
  
  let query = supabase
    .from('audits')
    .select('*')
    .eq('company_id', companyId);
  
  if (auditType && auditType !== 'all') {
    query = query.eq('audit_type', auditType);
  }
  
  if (status && status !== 'all') {
    query = query.eq('status', status === 'planned' ? 'Planejada' : status === 'in_progress' ? 'Em Andamento' : 'Concluída');
  }
  
  if (year) {
    query = query.gte('start_date', `${year}-01-01`).lte('start_date', `${year}-12-31`);
  }
  
  const { data, error } = await query.order('start_date', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    audits: data,
    total: data?.length || 0
  };
}

async function queryOkrs(args: any, companyId: string, supabase: any) {
  const { timePeriod, objectiveType, minProgress } = args;
  
  let query = supabase
    .from('okrs')
    .select(`
      *,
      key_results(*)
    `)
    .eq('company_id', companyId);
  
  if (timePeriod) {
    query = query.eq('time_period', timePeriod);
  }
  
  if (objectiveType && objectiveType !== 'all') {
    query = query.eq('objective_type', objectiveType);
  }
  
  if (minProgress !== undefined) {
    query = query.gte('progress_percentage', minProgress);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    okrs: data,
    total: data?.length || 0,
    averageProgress: data && data.length > 0
      ? (data.reduce((sum: number, o: any) => sum + (o.progress_percentage || 0), 0) / data.length).toFixed(1)
      : 0
  };
}

async function queryProjects(args: any, companyId: string, supabase: any) {
  const { status, category, budget } = args;
  
  let query = supabase
    .from('projects')
    .select(`
      *,
      project_tasks(count)
    `)
    .eq('company_id', companyId);
  
  if (status && status !== 'all') {
    query = query.eq('status', status === 'planning' ? 'Planejamento' : status === 'in_progress' ? 'Em Andamento' : status === 'on_hold' ? 'Pausado' : 'Concluído');
  }
  
  if (category && category !== 'all') {
    query = query.eq('category', category === 'environmental' ? 'Ambiental' : category === 'social' ? 'Social' : 'Governança');
  }
  
  if (budget) {
    if (budget.min) query = query.gte('budget', budget.min);
    if (budget.max) query = query.lte('budget', budget.max);
  }
  
  const { data, error } = await query.order('start_date', { ascending: false });
  
  if (error) return { error: error.message };
  
  return {
    success: true,
    projects: data,
    total: data?.length || 0,
    totalBudget: data ? data.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) : 0
  };
}

async function queryWasteData(args: any, companyId: string, supabase: any) {
  const { wasteClass, year = new Date().getFullYear(), groupBy } = args;
  
  let query = supabase
    .from('waste_logs')
    .select('*')
    .eq('company_id', companyId)
    .gte('log_date', `${year}-01-01`)
    .lte('log_date', `${year}-12-31`);
  
  if (wasteClass && wasteClass !== 'all') {
    const classMap: any = {
      'I': 'I - Perigoso',
      'IIA': 'II A - Não Inerte',
      'IIB': 'II B - Inerte'
    };
    query = query.eq('waste_class', classMap[wasteClass]);
  }
  
  const { data, error } = await query.order('log_date', { ascending: false });
  
  if (error) return { error: error.message };
  
  // Calculate aggregations
  const totalQuantity = data ? data.reduce((sum: number, w: any) => sum + (w.quantity || 0), 0) : 0;
  
  let groupedData: any = {};
  if (groupBy && data) {
    data.forEach((item: any) => {
      const key = groupBy === 'month' 
        ? new Date(item.log_date).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
        : item[groupBy === 'type' ? 'waste_type' : 'disposal_method'];
      
      if (!groupedData[key]) {
        groupedData[key] = { quantity: 0, count: 0 };
      }
      groupedData[key].quantity += item.quantity || 0;
      groupedData[key].count += 1;
    });
  }
  
  return {
    success: true,
    wasteData: data,
    total: data?.length || 0,
    totalQuantity,
    unit: 'kg',
    groupedData: groupBy ? groupedData : undefined
  };
}

async function queryIndicators(args: any, companyId: string, supabase: any) {
  const { category, frequency, withAlerts } = args;
  
  let query = supabase
    .from('indicators')
    .select(`
      *,
      indicator_measurements(*)
    `)
    .eq('company_id', companyId);
  
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  
  if (frequency && frequency !== 'all') {
    query = query.eq('measurement_frequency', frequency);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) return { error: error.message };
  
  // Filter indicators with alerts if requested
  let filteredData = data;
  if (withAlerts && data) {
    filteredData = data.filter((ind: any) => {
      const measurements = ind.indicator_measurements || [];
      return measurements.some((m: any) => m.deviation_level === 'warning' || m.deviation_level === 'critical');
    });
  }
  
  return {
    success: true,
    indicators: filteredData,
    total: filteredData?.length || 0
  };
}
