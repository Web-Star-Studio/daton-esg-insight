/**
 * Dynamic Context Builder
 * Provides page-specific context and data to enhance AI responses
 */
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/**
 * Build context based on current page/route
 */
export async function buildPageContext(
  currentPage: string,
  companyId: string,
  supabase: SupabaseClient
): Promise<string> {
  
  let context = '';
  
  switch (currentPage) {
    case '/dashboard':
    case '/':
      context = await buildDashboardContext(companyId, supabase);
      break;
    
    case '/inventario-gee':
      context = await buildEmissionsContext(companyId, supabase);
      break;
    
    case '/metas':
      context = await buildGoalsContext(companyId, supabase);
      break;
    
    case '/licenciamento':
      context = await buildLicensesContext(companyId, supabase);
      break;
    
    case '/gestao-tarefas':
      context = await buildTasksContext(companyId, supabase);
      break;
    
    case '/riscos-oportunidades':
      context = await buildRisksContext(companyId, supabase);
      break;
    
    case '/relatorio-gri':
      context = await buildGRIContext(companyId, supabase);
      break;
    
    case '/gestao-pessoas':
      context = await buildPeopleContext(companyId, supabase);
      break;
    
    default:
      context = '📍 **Contexto:** Página geral do sistema ESG';
  }
  
  return context;
}

/**
 * Dashboard Context
 */
async function buildDashboardContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get critical alerts
  const [tasksOverdue, licensesExpiringSoon, openNCs] = await Promise.all([
    supabase
      .from('data_collection_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'Em Atraso'),
    
    supabase
      .from('licenses')
      .select('id, license_name, expiry_date', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('expiry_date', now.toISOString())
      .lte('expiry_date', new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()),
    
    supabase
      .from('non_conformities')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', ['Aberta', 'Em Análise', 'Em Tratamento'])
  ]);

  return `
📍 **Página:** Dashboard Principal

🎯 **Foco da Análise:**
• Visão executiva consolidada
• Alertas críticos e prioridades
• KPIs principais de ESG
• Itens que precisam atenção imediata

⚠️ **Alertas Identificados:**
• Tarefas atrasadas: ${tasksOverdue.count || 0}
• Licenças vencendo (60 dias): ${licensesExpiringSoon.count || 0}
• Não conformidades abertas: ${openNCs.count || 0}

💡 **Sugestões Contextuais:**
- Priorize tarefas em atraso
- Inicie renovação de licenças próximas ao vencimento
- Acompanhe tratamento de não conformidades abertas
`;
}

/**
 * Emissions Context
 */
async function buildEmissionsContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const { data: emissions } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      activity_data!inner(
        emission_source_id,
        emission_sources!inner(scope, company_id)
      )
    `)
    .eq('activity_data.emission_sources.company_id', companyId)
    .gte('activity_data.period_start_date', oneYearAgo.toISOString());

  const scope1 = emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 1)
    .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0;
  const scope2 = emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 2)
    .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0;
  const scope3 = emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 3)
    .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0;

  return `
📍 **Página:** Inventário de Emissões GEE

🎯 **Foco da Análise:**
• Emissões por escopo (1, 2, 3)
• Principais fontes emissoras
• Tendências e variações
• Oportunidades de redução

📊 **Dados do Último Ano:**
• Escopo 1: ${scope1.toFixed(2)} tCO2e
• Escopo 2: ${scope2.toFixed(2)} tCO2e
• Escopo 3: ${scope3.toFixed(2)} tCO2e
• **Total:** ${(scope1 + scope2 + scope3).toFixed(2)} tCO2e

💡 **Capacidades Disponíveis:**
- Análise detalhada por fonte de emissão
- Comparação com períodos anteriores
- Identificação de hotspots
- Sugestões de ações de mitigação
`;
}

/**
 * Goals Context
 */
async function buildGoalsContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: goals } = await supabase
    .from('goals')
    .select('id, goal_name, progress_percentage, deadline_date, status')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  const atRisk = goals?.filter((g: any) => {
    const daysToDeadline = Math.ceil(
      (new Date(g.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return g.progress_percentage < 50 && daysToDeadline < 180;
  }).length || 0;

  return `
📍 **Página:** Gestão de Metas ESG

🎯 **Foco da Análise:**
• Progresso de metas ativas
• Identificação de metas em risco
• Análise preditiva de atingimento
• Recomendações estratégicas

📊 **Situação Atual:**
• Metas ativas: ${goals?.length || 0}
• Metas em risco: ${atRisk}

💡 **Análises Disponíveis:**
- Probabilidade de atingimento (análise preditiva)
- Comparação com histórico
- Identificação de gargalos
- Sugestão de aceleração de ações
`;
}

/**
 * Licenses Context
 */
async function buildLicensesContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  const { data: licenses } = await supabase
    .from('licenses')
    .select('id, license_name, license_type, expiry_date, status')
    .eq('company_id', companyId);

  const expiringSoon = licenses?.filter((l: any) => {
    const expiryDate = new Date(l.expiry_date);
    return expiryDate >= now && expiryDate <= ninetyDaysFromNow && l.status !== 'Vencida';
  }).length || 0;

  const expired = licenses?.filter((l: any) => l.status === 'Vencida').length || 0;

  return `
📍 **Página:** Licenciamento Ambiental

🎯 **Foco da Análise:**
• Status de licenças ambientais
• Prazos de validade e renovações
• Condicionantes e obrigações
• Riscos de não conformidade

⚠️ **Alertas Críticos:**
• Licenças vencidas: ${expired}
• Vencendo em 90 dias: ${expiringSoon}

💡 **Capacidades:**
- Priorização de renovações
- Cálculo de scoring de risco
- Alertas proativos de vencimento
- Mapear obrigações legais
`;
}

/**
 * Tasks Context
 */
async function buildTasksContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: tasks } = await supabase
    .from('data_collection_tasks')
    .select('id, status')
    .eq('company_id', companyId);

  const pending = tasks?.filter((t: any) => t.status === 'Pendente').length || 0;
  const overdue = tasks?.filter((t: any) => t.status === 'Em Atraso').length || 0;

  return `
📍 **Página:** Gestão de Tarefas

🎯 **Foco da Análise:**
• Tarefas pendentes e atrasadas
• Distribuição de responsabilidades
• Gargalos operacionais
• Otimização de processos

📊 **Status Atual:**
• Tarefas pendentes: ${pending}
• Tarefas atrasadas: ${overdue}

💡 **Análises Disponíveis:**
- Identificar padrões de atraso
- Sugerir redistribuição de carga
- Priorizar tarefas críticas
- Otimizar workflows
`;
}

/**
 * Risks Context
 */
async function buildRisksContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: risks } = await supabase
    .from('esg_risks')
    .select('id, inherent_risk_level, status')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  const critical = risks?.filter((r: any) => r.inherent_risk_level === 'Crítico').length || 0;
  const high = risks?.filter((r: any) => r.inherent_risk_level === 'Alto').length || 0;

  return `
📍 **Página:** Riscos e Oportunidades ESG

🎯 **Foco da Análise:**
• Riscos críticos e de alto impacto
• Efetividade de tratamentos
• Oportunidades identificadas
• Priorização de ações

⚠️ **Riscos Ativos:**
• Nível crítico: ${critical}
• Nível alto: ${high}

💡 **Capacidades:**
- Análise de matriz de risco
- Avaliação de controles
- Identificação de oportunidades
- Recomendações de mitigação
`;
}

/**
 * GRI Context
 */
async function buildGRIContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: reports } = await supabase
    .from('gri_reports')
    .select('id, reporting_year, completion_percentage')
    .eq('company_id', companyId)
    .order('reporting_year', { ascending: false })
    .limit(1);

  const latestReport = reports?.[0];

  return `
📍 **Página:** Relatório GRI

🎯 **Foco da Análise:**
• Indicadores GRI obrigatórios e opcionais
• Completude do relatório
• Qualidade dos dados
• Conformidade com padrões GRI

📊 **Relatório Atual:**
• Ano: ${latestReport?.reporting_year || 'N/A'}
• Completude: ${latestReport?.completion_percentage || 0}%

💡 **Capacidades:**
- Sugerir valores para indicadores
- Identificar gaps de dados
- Validar conformidade GRI
- Recomendar melhorias
`;
}

/**
 * People Context
 */
async function buildPeopleContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: employees } = await supabase
    .from('employees')
    .select('id, gender, status')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  const total = employees?.length || 0;
  const genderDiversity = employees?.reduce((acc: any, e: any) => {
    acc[e.gender || 'Não informado'] = (acc[e.gender || 'Não informado'] || 0) + 1;
    return acc;
  }, {});

  return `
📍 **Página:** Gestão de Pessoas

🎯 **Foco da Análise:**
• Diversidade e inclusão
• Treinamentos e desenvolvimento
• Saúde e segurança
• Clima organizacional

📊 **Dados:**
• Total de funcionários: ${total}
• Diversidade de gênero: ${JSON.stringify(genderDiversity || {})}

💡 **Capacidades:**
- Análise de diversidade
- Gaps de treinamento
- Indicadores de RH
- Recomendações de D&I
`;
}
