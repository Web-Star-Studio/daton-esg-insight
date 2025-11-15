import { supabase } from "@/integrations/supabase/client";

export interface GRIFinancialData {
  indicator: string;
  description: string;
  value: number;
  unit: string;
  year: number;
  source: string;
}

/**
 * Export financial data formatted for GRI reporting
 */
export async function exportFinancialDataForGRI(year: number): Promise<GRIFinancialData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const exportData: GRIFinancialData[] = [];

  // GRI 201-1: Valor econômico direto gerado e distribuído
  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

  // Receitas
  const { data: receivables } = await supabase
    .from('accounts_receivable')
    .select('final_amount, status')
    .eq('company_id', profile.company_id)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  const totalRevenue = receivables
    ?.filter(r => r.status === 'Recebido')
    .reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;

  exportData.push({
    indicator: 'GRI 201-1',
    description: 'Receitas totais',
    value: totalRevenue,
    unit: 'BRL',
    year,
    source: 'accounts_receivable'
  });

  // Custos operacionais
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('final_amount, status, esg_category')
    .eq('company_id', profile.company_id)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  const totalOperatingCosts = payables
    ?.filter(p => p.status === 'Pago')
    .reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;

  exportData.push({
    indicator: 'GRI 201-1',
    description: 'Custos operacionais',
    value: totalOperatingCosts,
    unit: 'BRL',
    year,
    source: 'accounts_payable'
  });

  // GRI 201-2: Investimentos ESG
  const esgCosts = {
    environmental: 0,
    social: 0,
    governance: 0
  };

  payables?.forEach(p => {
    if (p.status === 'Pago' && p.esg_category) {
      const amount = p.final_amount || 0;
      if (p.esg_category === 'Environmental') esgCosts.environmental += amount;
      if (p.esg_category === 'Social') esgCosts.social += amount;
      if (p.esg_category === 'Governance') esgCosts.governance += amount;
    }
  });

  exportData.push({
    indicator: 'GRI 201-2',
    description: 'Investimentos Ambientais',
    value: esgCosts.environmental,
    unit: 'BRL',
    year,
    source: 'accounts_payable (ESG)'
  });

  exportData.push({
    indicator: 'GRI 201-2',
    description: 'Investimentos Sociais',
    value: esgCosts.social,
    unit: 'BRL',
    year,
    source: 'accounts_payable (ESG)'
  });

  exportData.push({
    indicator: 'GRI 201-2',
    description: 'Investimentos em Governança',
    value: esgCosts.governance,
    unit: 'BRL',
    year,
    source: 'accounts_payable (ESG)'
  });

  // GRI 201-4: Assistência financeira recebida do governo (se aplicável)
  const { data: governmentAid } = await supabase
    .from('accounts_receivable')
    .select('final_amount')
    .eq('company_id', profile.company_id)
    .ilike('customer_name', '%governo%')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  const totalGovernmentAid = governmentAid?.reduce((sum, r) => sum + (r.final_amount || 0), 0) || 0;

  if (totalGovernmentAid > 0) {
    exportData.push({
      indicator: 'GRI 201-4',
      description: 'Assistência financeira governamental',
      value: totalGovernmentAid,
      unit: 'BRL',
      year,
      source: 'accounts_receivable'
    });
  }

  return exportData;
}

/**
 * Generate CSV export of financial data for GRI
 */
export function generateGRIFinancialCSV(data: GRIFinancialData[]): string {
  const headers = ['Indicador GRI', 'Descrição', 'Valor', 'Unidade', 'Ano', 'Fonte'];
  const rows = data.map(item => [
    item.indicator,
    item.description,
    item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    item.unit,
    item.year.toString(),
    item.source
  ]);

  const csv = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  return csv;
}

/**
 * Download financial data as CSV for GRI reporting
 */
export async function downloadGRIFinancialExport(year: number) {
  const data = await exportFinancialDataForGRI(year);
  const csv = generateGRIFinancialCSV(data);
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `dados-financeiros-gri-${year}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
