/**
 * Tool Executors - Implement the actual data queries
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export async function executeReadTool(
  toolName: string,
  args: any,
  companyId: string,
  supabaseClient: any
): Promise<any> {
  console.log(`Executing read tool: ${toolName}`, args);

  try {
    switch (toolName) {
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
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: error.message };
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
