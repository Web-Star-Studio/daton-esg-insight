import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface AccountingEntry {
  id: string;
  company_id: string;
  entry_number: string;
  entry_date: string;
  accounting_date: string;
  description: string;
  document_type?: string;
  document_number?: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingEntryLine {
  id: string;
  entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_id?: string;
  project_id?: string;
  description?: string;
  created_at: string;
}

export interface AccountingEntryWithLines extends AccountingEntry {
  lines: AccountingEntryLine[];
}

export const accountingEntriesService = {
  async getEntries(startDate?: string, endDate?: string): Promise<AccountingEntry[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('accounting_entries')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('entry_date', { ascending: false });

    if (startDate) {
      query = query.gte('entry_date', startDate);
    }
    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getEntryWithLines(id: string): Promise<AccountingEntryWithLines | null> {
    const { data: entry, error: entryError } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (entryError) throw entryError;
    if (!entry) return null;

    const { data: lines, error: linesError } = await supabase
      .from('accounting_entry_lines')
      .select('*')
      .eq('entry_id', id);

    if (linesError) throw linesError;

    return {
      ...entry,
      lines: lines || [],
    };
  },

  async getNextEntryNumber(): Promise<string> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('accounting_entries')
      .select('entry_number')
      .eq('company_id', profile.company_id)
      .order('entry_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return '1';
    }

    const lastNumber = parseInt(data[0].entry_number);
    return (lastNumber + 1).toString();
  },

  async createEntry(
    entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at' | 'company_id'>,
    lines: Omit<AccountingEntryLine, 'id' | 'entry_id' | 'created_at'>[]
  ): Promise<AccountingEntryWithLines> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    // Validar balanceamento
    const totalDebit = lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit_amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      unifiedToast.error('Lançamento desbalanceado: débito deve ser igual ao crédito');
      throw new Error('Lançamento desbalanceado');
    }

    // Criar entry
    const { data: newEntry, error: entryError } = await supabase
      .from('accounting_entries')
      .insert([{
        ...entry,
        company_id: profile.company_id,
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (entryError) {
      unifiedToast.error('Erro ao criar lançamento contábil');
      throw entryError;
    }

    // Criar lines
    const linesToInsert = lines.map(line => ({
      ...line,
      entry_id: newEntry.id,
    }));

    const { data: newLines, error: linesError } = await supabase
      .from('accounting_entry_lines')
      .insert(linesToInsert)
      .select();

    if (linesError) {
      // Rollback: deletar entry
      await supabase.from('accounting_entries').delete().eq('id', newEntry.id);
      unifiedToast.error('Erro ao criar partidas do lançamento');
      throw linesError;
    }

    unifiedToast.success('Lançamento contábil criado com sucesso');
    
    return {
      ...newEntry,
      lines: newLines || [],
    };
  },

  async confirmEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounting_entries')
      .update({
        status: 'Confirmado',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao confirmar lançamento');
      throw error;
    }

    unifiedToast.success('Lançamento confirmado com sucesso');
  },

  async cancelEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounting_entries')
      .update({ status: 'Cancelado' })
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao cancelar lançamento');
      throw error;
    }

    unifiedToast.success('Lançamento cancelado com sucesso');
  },

  async deleteEntry(id: string): Promise<void> {
    // Lines serão deletados automaticamente por CASCADE
    const { error } = await supabase
      .from('accounting_entries')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar lançamento');
      throw error;
    }

    unifiedToast.success('Lançamento deletado com sucesso');
  },
};
