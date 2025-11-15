import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface AccountPayable {
  id: string;
  company_id: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_date?: string;
  original_amount: number;
  paid_amount: number;
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
  barcode?: string;
  pix_key?: string;
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  installment_number?: number;
  total_installments?: number;
  notes?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const accountsPayableService = {
  async getPayables(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<AccountPayable[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('accounts_payable')
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

  async getOverduePayables(): Promise<AccountPayable[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('company_id', profile.company_id)
      .lt('due_date', today)
      .in('status', ['Pendente', 'Parcial'])
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createPayable(payable: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<AccountPayable> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const finalAmount = payable.original_amount - payable.discount_amount + payable.interest_amount + payable.fine_amount;

    const { data, error } = await supabase
      .from('accounts_payable')
      .insert([{
        ...payable,
        company_id: profile.company_id,
        final_amount: finalAmount,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar conta a pagar');
      throw error;
    }

    unifiedToast.success('Conta a pagar criada com sucesso');
    return data;
  },

  async updatePayable(id: string, updates: Partial<AccountPayable>): Promise<AccountPayable> {
    if (updates.original_amount !== undefined || updates.discount_amount !== undefined || 
        updates.interest_amount !== undefined || updates.fine_amount !== undefined) {
      const { data: current } = await supabase
        .from('accounts_payable')
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
      .from('accounts_payable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar conta a pagar');
      throw error;
    }

    unifiedToast.success('Conta a pagar atualizada com sucesso');
    return data;
  },

  async registerPayment(id: string, payment: { amount: number; payment_date: string; payment_method: string; bank_account_id?: string; notes?: string }): Promise<void> {
    const { data: payable } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', id)
      .single();

    if (!payable) throw new Error('Conta a pagar não encontrada');

    const newPaidAmount = payable.paid_amount + payment.amount;
    const newStatus = newPaidAmount >= (payable.final_amount || payable.original_amount) ? 'Pago' : 'Parcial';

    // Atualizar payable
    const { error: updateError } = await supabase
      .from('accounts_payable')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        payment_date: newStatus === 'Pago' ? payment.payment_date : payable.payment_date,
      })
      .eq('id', id);

    if (updateError) {
      unifiedToast.error('Erro ao registrar pagamento');
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
        payable_id: id,
        payment_date: payment.payment_date,
        amount: payment.amount,
        payment_method: payment.payment_method,
        bank_account_id: payment.bank_account_id,
        notes: payment.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }]);

    if (historyError) {
      unifiedToast.error('Erro ao criar histórico de pagamento');
      throw historyError;
    }

    unifiedToast.success('Pagamento registrado com sucesso');
  },

  async approvePayable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_payable')
      .update({
        approval_status: 'Aprovado',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao aprovar conta a pagar');
      throw error;
    }

    unifiedToast.success('Conta a pagar aprovada com sucesso');
  },

  async rejectPayable(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_payable')
      .update({
        approval_status: 'Rejeitado',
        rejection_reason: reason,
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao rejeitar conta a pagar');
      throw error;
    }

    unifiedToast.warning('Conta a pagar rejeitada');
  },

  async deletePayable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar conta a pagar');
      throw error;
    }

    unifiedToast.success('Conta a pagar deletada com sucesso');
  },
};
