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
    
    // Financial pages
    case '/financeiro/dashboard':
      context = await buildFinancialDashboardContext(companyId, supabase);
      break;
    
    case '/financeiro/lancamentos':
      context = await buildAccountingEntriesContext(companyId, supabase);
      break;
    
    case '/financeiro/contas-pagar':
      context = await buildAccountsPayableContext(companyId, supabase);
      break;
    
    case '/financeiro/contas-receber':
      context = await buildAccountsReceivableContext(companyId, supabase);
      break;
    
    case '/financeiro/esg-dashboard':
      context = await buildESGFinancialContext(companyId, supabase);
      break;
    
    case '/financeiro/relatorios':
    case '/financeiro/rentabilidade':
      context = await buildFinancialReportsContext(companyId, supabase);
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

/**
 * Financial Dashboard Context
 */
async function buildFinancialDashboardContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [payables, receivables, bankAccounts] = await Promise.all([
    supabase
      .from('accounts_payable')
      .select('final_amount, status, due_date', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('due_date', firstDayOfMonth.toISOString()),
    
    supabase
      .from('accounts_receivable')
      .select('final_amount, status, due_date', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('due_date', firstDayOfMonth.toISOString()),
    
    supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId)
      .eq('status', 'Ativa')
  ]);

  const totalPayable = payables.data?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;
  const totalReceivable = receivables.data?.reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;
  const totalBalance = bankAccounts.data?.reduce((sum, b) => sum + (b.current_balance || 0), 0) || 0;

  return `
📍 **Página:** Dashboard Financeiro

💰 **Resumo Financeiro (Mês Atual):**
• Saldo em contas: R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Contas a pagar: R$ ${totalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${payables.count || 0} contas)
• Contas a receber: R$ ${totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${receivables.count || 0} contas)
• Saldo projetado: R$ ${(totalBalance + totalReceivable - totalPayable).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

💡 **Assistência Contextual:**
- Posso projetar seu fluxo de caixa para os próximos meses
- Posso analisar padrões de receitas e despesas
- Posso calcular índices financeiros (liquidez, rentabilidade)
- Posso identificar contas em atraso ou próximas ao vencimento
`;
}

/**
 * Accounting Entries Context
 */
async function buildAccountingEntriesContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const { data: entries, count } = await supabase
    .from('accounting_entries')
    .select('status, total_debit, total_credit', { count: 'exact' })
    .eq('company_id', companyId)
    .gte('accounting_date', firstDayOfMonth.toISOString());

  const totalDebit = entries?.reduce((sum, e) => sum + e.total_debit, 0) || 0;
  const totalCredit = entries?.reduce((sum, e) => sum + e.total_credit, 0) || 0;
  const draftCount = entries?.filter(e => e.status === 'Rascunho').length || 0;

  return `
📍 **Página:** Lançamentos Contábeis

📊 **Lançamentos (Mês Atual):**
• Total de lançamentos: ${count || 0}
• Rascunhos pendentes: ${draftCount}
• Total débito: R$ ${totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Total crédito: R$ ${totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

💡 **Assistência Contextual:**
- Posso revisar lançamentos pendentes de aprovação
- Posso identificar inconsistências contábeis
- Posso sugerir categorizações ESG para lançamentos
- Posso gerar relatórios contábeis customizados
`;
}

/**
 * Accounts Payable Context
 */
async function buildAccountsPayableContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const [overdue, dueSoon, esgRelated] = await Promise.all([
    supabase
      .from('accounts_payable')
      .select('final_amount', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('status', 'Pendente')
      .lt('due_date', now.toISOString()),
    
    supabase
      .from('accounts_payable')
      .select('final_amount', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('status', 'Pendente')
      .gte('due_date', now.toISOString())
      .lte('due_date', next7Days.toISOString()),
    
    supabase
      .from('accounts_payable')
      .select('esg_category, final_amount')
      .eq('company_id', companyId)
      .not('esg_category', 'is', null)
  ]);

  const overdueAmount = overdue.data?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;
  const dueSoonAmount = dueSoon.data?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;

  return `
📍 **Página:** Contas a Pagar

⚠️ **Alertas:**
• Contas em atraso: ${overdue.count || 0} (R$ ${overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
• Vencimento em 7 dias: ${dueSoon.count || 0} (R$ ${dueSoonAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
• Contas com categoria ESG: ${esgRelated.data?.length || 0}

💡 **Assistência Contextual:**
- Posso priorizar pagamentos por urgência e impacto
- Posso identificar fornecedores ESG
- Posso sugerir renegociações com base em padrões
- Posso calcular custo ESG mensal/anual
`;
}

/**
 * Accounts Receivable Context
 */
async function buildAccountsReceivableContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  
  const [overdue, pending] = await Promise.all([
    supabase
      .from('accounts_receivable')
      .select('final_amount', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('status', 'Pendente')
      .lt('due_date', now.toISOString()),
    
    supabase
      .from('accounts_receivable')
      .select('final_amount', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('status', 'Pendente')
  ]);

  const overdueAmount = overdue.data?.reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;
  const pendingAmount = pending.data?.reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;

  return `
📍 **Página:** Contas a Receber

📈 **Situação:**
• Total pendente: R$ ${pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pending.count || 0} contas)
• Em atraso: R$ ${overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${overdue.count || 0} contas)
• Taxa de inadimplência: ${pending.count ? ((overdue.count || 0) / pending.count * 100).toFixed(1) : 0}%

💡 **Assistência Contextual:**
- Posso identificar clientes com maior risco de inadimplência
- Posso sugerir ações de cobrança priorizadas
- Posso prever recebimentos para os próximos meses
- Posso analisar padrões de pagamento por cliente
`;
}

/**
 * ESG Financial Context
 */
async function buildESGFinancialContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const { data: stats, error } = await supabase.rpc('get_esg_financial_stats', {
    p_company_id: companyId,
    p_year: new Date().getFullYear()
  });

  if (error || !stats) {
    return `
📍 **Página:** Dashboard ESG Financeiro

💡 **Assistência Contextual:**
- Configure vínculos ESG em suas transações para análises detalhadas
- Posso ajudar a categorizar despesas por pilar ESG
- Posso calcular ROI de iniciativas ESG
`;
  }

  return `
📍 **Página:** Dashboard ESG Financeiro

🌱 **Impacto Financeiro ESG (${stats.year}):**
• Total ESG: R$ ${stats.total_esg_costs?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
• Ambiental: R$ ${stats.environmental_costs?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
• Social: R$ ${stats.social_costs?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
• Governança: R$ ${stats.governance_costs?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
• % do total de despesas: ${stats.esg_percentage?.toFixed(2) || '0.00'}%
• Impacto carbono estimado: ${stats.total_carbon_impact?.toLocaleString('pt-BR') || '0'} tCO2e

💡 **Assistência Contextual:**
- Posso calcular ROI de cada iniciativa ESG
- Posso comparar seu investimento ESG com benchmarks de mercado
- Posso identificar oportunidades de economia com impacto ESG
- Posso projetar custos ESG futuros
`;
}

/**
 * Financial Reports Context
 */
async function buildFinancialReportsContext(companyId: string, supabase: SupabaseClient): Promise<string> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  const [entries, payables, receivables] = await Promise.all([
    supabase
      .from('accounting_entries')
      .select('total_debit, total_credit', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('accounting_date', startOfYear.toISOString()),
    
    supabase
      .from('accounts_payable')
      .select('final_amount, status')
      .eq('company_id', companyId)
      .gte('due_date', startOfYear.toISOString()),
    
    supabase
      .from('accounts_receivable')
      .select('final_amount, status')
      .eq('company_id', companyId)
      .gte('due_date', startOfYear.toISOString())
  ]);

  const totalExpenses = payables.data?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;
  const totalRevenue = receivables.data?.reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;
  const paidExpenses = payables.data?.filter(p => p.status === 'Pago').reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;
  const receivedRevenue = receivables.data?.filter(r => r.status === 'Recebido').reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;

  return `
📍 **Página:** Relatórios Financeiros

📊 **Dados Anuais (${now.getFullYear()}):**
• Lançamentos contábeis: ${entries.count || 0}
• Receitas: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${((receivedRevenue / totalRevenue) * 100).toFixed(1)}% realizadas)
• Despesas: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${((paidExpenses / totalExpenses) * 100).toFixed(1)}% pagas)
• Resultado: R$ ${(totalRevenue - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

💡 **Assistência Contextual:**
- Posso gerar DRE (Demonstração de Resultado)
- Posso criar análise de rentabilidade por período
- Posso comparar desempenho com períodos anteriores
- Posso identificar principais custos e receitas
- Posso gerar relatórios personalizados
`;
}
