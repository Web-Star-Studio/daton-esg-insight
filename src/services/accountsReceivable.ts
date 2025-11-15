import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface AccountReceivable {
  id: string;
  company_id: string;
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  receipt_date?: string;
  original_amount: number;
  received_amount: number;
  discount_amount: number;
  interest_amount: number;
  fine_amount: number;
  final_amount?: number;
  status: string;
  payment_method?: string;
  category: string;
  cost_center_id?: string;
  project_id?: string;
  bank_account_id?: string;
  installment_number?: number;
  total_installments?: number;
  notes?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const accountsReceivableService = {
  async getReceivables(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<AccountReceivable[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('accounts_receivable')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('due_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('due_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('due_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getOverdueReceivables(): Promise<AccountReceivable[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('company_id', profile.company_id)
      .lt('due_date', today)
      .in('status', ['Pendente', 'Parcial'])
      .order('due_date', { ascending: true});

    if (error) throw error;
    return data || [];
  },

  async createReceivable(receivable: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<AccountReceivable> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const finalAmount = receivable.original_amount - receivable.discount_amount + receivable.interest_amount + receivable.fine_amount;

    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert([{
        ...receivable,
        company_id: profile.company_id,
        final_amount: finalAmount,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar conta a receber');
      throw error;
    }

    unifiedToast.success('Conta a receber criada com sucesso');
    return data;
  },

  async updateReceivable(id: string, updates: Partial<AccountReceivable>): Promise<AccountReceivable> {
    if (updates.original_amount !== undefined || updates.discount_amount !== undefined || 
        updates.interest_amount !== undefined || updates.fine_amount !== undefined) {
      const { data: current } = await supabase
        .from('accounts_receivable')
        .select('original_amount, discount_amount, interest_amount, fine_amount')
        .eq('id', id)
        .single();

      if (current) {
        const original = updates.original_amount ?? current.original_amount;
        const discount = updates.discount_amount ?? current.discount_amount;
        const interest = updates.interest_amount ?? current.interest_amount;
        const fine = updates.fine_amount ?? current.fine_amount;
        updates.final_amount = original - discount + interest + fine;
      }
    }

    const { data, error } = await supabase
      .from('accounts_receivable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar conta a receber');
      throw error;
    }

    unifiedToast.success('Conta a receber atualizada com sucesso');
    return data;
  },

  async registerReceipt(id: string, receipt: { amount: number; receipt_date: string; payment_method: string; bank_account_id?: string; notes?: string }): Promise<void> {
    const { data: receivable } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', id)
      .single();

    if (!receivable) throw new Error('Conta a receber não encontrada');

    const newReceivedAmount = receivable.received_amount + receipt.amount;
    const newStatus = newReceivedAmount >= (receivable.final_amount || receivable.original_amount) ? 'Recebido' : 'Parcial';

    // Atualizar receivable
    const { error: updateError } = await supabase
      .from('accounts_receivable')
      .update({
        received_amount: newReceivedAmount,
        status: newStatus,
        receipt_date: newStatus === 'Recebido' ? receipt.receipt_date : receivable.receipt_date,
      })
      .eq('id', id);

    if (updateError) {
      unifiedToast.error('Erro ao registrar recebimento');
      throw updateError;
    }

    // Criar histórico
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    const { error: historyError } = await supabase
      .from('payment_history')
      .insert([{
        company_id: profile?.company_id,
        receivable_id: id,
        payment_date: receipt.receipt_date,
        amount: receipt.amount,
        payment_method: receipt.payment_method,
        bank_account_id: receipt.bank_account_id,
        notes: receipt.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }]);

    if (historyError) {
      unifiedToast.error('Erro ao criar histórico de recebimento');
      throw historyError;
    }

    unifiedToast.success('Recebimento registrado com sucesso');
  },

  async deleteReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar conta a receber');
      throw error;
    }

    unifiedToast.success('Conta a receber deletada com sucesso');
  },
};
