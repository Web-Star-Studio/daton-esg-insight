/**
 * Financial Tool Executors
 * Implements financial data queries and analysis
 */

export async function queryAccountingEntries(args: any, companyId: string, supabase: any) {
  const { startDate, endDate, status, includeDetails } = args;
  
  let query = supabase
    .from('accounting_entries')
    .select(includeDetails ? `*, accounting_entry_lines(*)` : '*')
    .eq('company_id', companyId);
  
  if (startDate) query = query.gte('accounting_date', startDate);
  if (endDate) query = query.lte('accounting_date', endDate);
  if (status && status !== 'all') query = query.eq('status', status);
  
  const { data, error } = await query.order('accounting_date', { ascending: false });
  
  if (error) throw error;
  
  return {
    success: true,
    entries: data,
    total: data?.length || 0,
    summary: {
      totalDebit: data?.reduce((sum: number, e: any) => sum + e.total_debit, 0) || 0,
      totalCredit: data?.reduce((sum: number, e: any) => sum + e.total_credit, 0) || 0
    }
  };
}

export async function queryAccountsPayable(args: any, companyId: string, supabase: any) {
  const { status, dueInDays, esgCategory, includeSupplierInfo } = args;
  
  let query = supabase
    .from('accounts_payable')
    .select(includeSupplierInfo ? `*, suppliers(*)` : '*')
    .eq('company_id', companyId);
  
  if (status && status !== 'all') query = query.eq('status', status);
  if (esgCategory && esgCategory !== 'all') query = query.eq('esg_category', esgCategory);
  
  if (dueInDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dueInDays);
    query = query.lte('due_date', futureDate.toISOString());
  }
  
  const { data, error } = await query.order('due_date', { ascending: true });
  
  if (error) throw error;
  
  return {
    success: true,
    payables: data,
    total: data?.length || 0,
    totalAmount: data?.reduce((sum: number, p: any) => sum + (p.final_amount || 0), 0) || 0
  };
}

export async function queryAccountsReceivable(args: any, companyId: string, supabase: any) {
  const { status, dueInDays, esgCategory } = args;
  
  let query = supabase
    .from('accounts_receivable')
    .select('*')
    .eq('company_id', companyId);
  
  if (status && status !== 'all') query = query.eq('status', status);
  if (esgCategory && esgCategory !== 'all') query = query.eq('esg_category', esgCategory);
  
  if (dueInDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dueInDays);
    query = query.lte('due_date', futureDate.toISOString());
  }
  
  const { data, error } = await query.order('due_date', { ascending: true });
  
  if (error) throw error;
  
  return {
    success: true,
    receivables: data,
    total: data?.length || 0,
    totalAmount: data?.reduce((sum: number, r: any) => sum + (r.final_amount || 0), 0) || 0
  };
}

export async function calculateFinancialRatios(args: any, companyId: string, supabase: any) {
  const { period, ratios } = args;
  
  // Simplified calculation - would need more complex logic in production
  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('company_id', companyId);
  
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('final_amount')
    .eq('company_id', companyId)
    .eq('status', 'Pendente');
  
  const totalBalance = bankAccounts?.reduce((sum: number, b: any) => sum + (b.current_balance || 0), 0) || 0;
  const totalDebt = payables?.reduce((sum: number, p: any) => sum + (p.final_amount || 0), 0) || 0;
  
  return {
    success: true,
    period,
    ratios: {
      liquidity: totalDebt > 0 ? (totalBalance / totalDebt).toFixed(2) : 'N/A',
      currentBalance: totalBalance,
      currentDebt: totalDebt
    }
  };
}

export async function predictCashFlow(args: any, companyId: string, supabase: any) {
  const { forecastMonths, includeESGImpact } = args;
  
  const projections = [];
  const today = new Date();
  
  for (let i = 1; i <= forecastMonths; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
    
    const [payables, receivables] = await Promise.all([
      supabase
        .from('accounts_payable')
        .select('final_amount')
        .eq('company_id', companyId)
        .gte('due_date', monthDate.toISOString())
        .lt('due_date', nextMonth.toISOString()),
      
      supabase
        .from('accounts_receivable')
        .select('final_amount')
        .eq('company_id', companyId)
        .gte('due_date', monthDate.toISOString())
        .lt('due_date', nextMonth.toISOString())
    ]);
    
    const expenses = payables.data?.reduce((sum: number, p: any) => sum + (p.final_amount || 0), 0) || 0;
    const revenue = receivables.data?.reduce((sum: number, r: any) => sum + (r.final_amount || 0), 0) || 0;
    
    projections.push({
      month: monthDate.toISOString().slice(0, 7),
      projectedRevenue: revenue,
      projectedExpenses: expenses,
      netCashFlow: revenue - expenses
    });
  }
  
  return {
    success: true,
    forecastMonths,
    projections
  };
}

export async function analyzeESGFinancialImpact(args: any, companyId: string, supabase: any) {
  const { year, category, includeROI } = args;
  const targetYear = year || new Date().getFullYear();
  
  const { data, error } = await supabase.rpc('get_esg_financial_stats', {
    p_company_id: companyId,
    p_year: targetYear
  });
  
  if (error) throw error;
  
  return {
    success: true,
    year: targetYear,
    stats: data,
    message: `Análise ESG financeira para ${targetYear}`
  };
}

export async function queryBankAccounts(args: any, companyId: string, supabase: any) {
  const { includeBalances, includeProjections } = args;
  
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Ativa');
  
  if (error) throw error;
  
  const totalBalance = data?.reduce((sum: number, b: any) => sum + (b.current_balance || 0), 0) || 0;
  
  return {
    success: true,
    accounts: data,
    totalBalance,
    count: data?.length || 0
  };
}

export async function analyzeFinancialTrends(args: any, companyId: string, supabase: any) {
  const { metric, period, groupBy } = args;
  
  // Simplified trend analysis
  let table = metric === 'revenue' ? 'accounts_receivable' : 'accounts_payable';
  
  const { data, error } = await supabase
    .from(table)
    .select('final_amount, due_date, esg_category')
    .eq('company_id', companyId)
    .order('due_date', { ascending: true });
  
  if (error) throw error;
  
  return {
    success: true,
    metric,
    period,
    data: data || [],
    total: data?.reduce((sum: number, item: any) => sum + (item.final_amount || 0), 0) || 0
  };
}
