import { supabase } from '@/integrations/supabase/client';

export interface DREData {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  depreciacaoAmortizacao: number;
  ebit: number;
  resultadoFinanceiro: number;
  lair: number;
  impostos: number;
  lucroLiquido: number;
  margemBruta: number;
  margemEbitda: number;
  margemLiquida: number;
}

export interface FinancialIndicators {
  liquidezCorrente: number;
  roe: number;
  roa: number;
  margemBruta: number;
  margemEbitda: number;
  margemLiquida: number;
  giroEstoque: number;
  prazoMedioRecebimento: number;
  prazoMedioPagamento: number;
}

export const financialReports = {
  async getDRE(year: number, month?: number): Promise<DREData> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    // Get cash flow transactions
    let startDate = `${year}-01-01`;
    let endDate = `${year}-12-31`;

    if (month) {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }

    const { data: transactions } = await supabase
      .from('cash_flow_transactions')
      .select('type, category, amount, status')
      .eq('company_id', profile.company_id)
      .eq('status', 'realizado')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    // Calculate revenues
    const receitas = (transactions || [])
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate costs and expenses
    const despesas = (transactions || [])
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Simplified DRE calculation (adjust categories as needed)
    const receitaBruta = receitas;
    const deducoes = receitaBruta * 0.15; // Estimate
    const receitaLiquida = receitaBruta - deducoes;
    const custos = despesas * 0.4; // Estimate CMV
    const lucroBruto = receitaLiquida - custos;
    const despesasOperacionais = despesas * 0.6; // Other expenses
    const ebitda = lucroBruto - despesasOperacionais;
    const depreciacaoAmortizacao = despesas * 0.05; // Estimate
    const ebit = ebitda - depreciacaoAmortizacao;
    const resultadoFinanceiro = 0; // Would need financial transactions
    const lair = ebit + resultadoFinanceiro;
    const impostos = lair * 0.34; // Estimate
    const lucroLiquido = lair - impostos;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos,
      lucroBruto,
      despesasOperacionais,
      ebitda,
      depreciacaoAmortizacao,
      ebit,
      resultadoFinanceiro,
      lair,
      impostos,
      lucroLiquido,
      margemBruta: receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0,
      margemEbitda: receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0,
      margemLiquida: receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0,
    };
  },

  async getFinancialIndicators(year: number): Promise<FinancialIndicators> {
    // This is a simplified version - in production, you'd calculate from actual balance sheet
    const dre = await this.getDRE(year);

    return {
      liquidezCorrente: 1.5, // Would need balance sheet data
      roe: 15, // Would need equity data
      roa: 10, // Would need assets data
      margemBruta: dre.margemBruta,
      margemEbitda: dre.margemEbitda,
      margemLiquida: dre.margemLiquida,
      giroEstoque: 6, // Would need inventory data
      prazoMedioRecebimento: 30, // Would calculate from receivables
      prazoMedioPagamento: 45, // Would calculate from payables
    };
  },

  async getMonthlyComparison(year: number): Promise<Array<{
    month: string;
    receitas: number;
    despesas: number;
    lucro: number;
  }>> {
    const months = [];
    
    for (let month = 1; month <= 12; month++) {
      const dre = await this.getDRE(year, month);
      months.push({
        month: new Date(year, month - 1).toLocaleString('pt-BR', { month: 'short' }),
        receitas: dre.receitaLiquida,
        despesas: dre.custos + dre.despesasOperacionais,
        lucro: dre.lucroLiquido,
      });
    }

    return months;
  },
};
