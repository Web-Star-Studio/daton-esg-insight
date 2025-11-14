import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface CashFlowTransaction {
  id: string;
  company_id: string;
  transaction_date: string;
  due_date?: string;
  type: string;
  category: string;
  description?: string;
  amount: number;
  status: string;
  payment_method?: string;
  cost_center_id?: string;
  project_id?: string;
  supplier_id?: string;
  waste_log_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlowSummary {
  currentBalance: number;
  projectedBalance: number;
  monthlyInflows: number;
  monthlyOutflows: number;
  netCashFlow: number;
  overduePayables: number;
  overdueReceivables: number;
}

export const cashFlowService = {
  async getTransactions(startDate?: string, endDate?: string): Promise<CashFlowTransaction[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('cash_flow_transactions')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getCashFlowSummary(month: number, year: number): Promise<CashFlowSummary> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const transactions = await this.getTransactions(startDate, endDate);

    const realized = transactions.filter(t => t.status === 'realizado');
    const monthlyInflows = realized
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyOutflows = realized
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow = monthlyInflows - monthlyOutflows;

    // Get projected balance (include previsto transactions)
    const projected = transactions.filter(t => t.status === 'previsto');
    const projectedInflows = projected
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const projectedOutflows = projected
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const projectedBalance = netCashFlow + projectedInflows - projectedOutflows;

    // Calculate overdue
    const today = new Date().toISOString().split('T')[0];
    const overdue = transactions.filter(
      t => t.status === 'previsto' && t.due_date && t.due_date < today
    );

    const overduePayables = overdue
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const overdueReceivables = overdue
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      currentBalance: netCashFlow,
      projectedBalance,
      monthlyInflows,
      monthlyOutflows,
      netCashFlow,
      overduePayables,
      overdueReceivables,
    };
  },

  async createTransaction(
    transaction: Omit<CashFlowTransaction, 'id' | 'created_at' | 'updated_at' | 'company_id'>
  ): Promise<CashFlowTransaction> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('cash_flow_transactions')
      .insert([{
        ...transaction,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar transação');
      throw error;
    }

    unifiedToast.success('Transação criada com sucesso');
    return data;
  },

  async updateTransaction(id: string, updates: Partial<CashFlowTransaction>): Promise<CashFlowTransaction> {
    const { data, error } = await supabase
      .from('cash_flow_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar transação');
      throw error;
    }

    unifiedToast.success('Transação atualizada com sucesso');
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('cash_flow_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar transação');
      throw error;
    }

    unifiedToast.success('Transação deletada com sucesso');
  },

  async markAsRealized(id: string, actualDate: string): Promise<void> {
    await this.updateTransaction(id, {
      status: 'realizado',
      transaction_date: actualDate,
    });
  },
};
