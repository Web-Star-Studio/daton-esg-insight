import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface ChartOfAccount {
  id: string;
  company_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_nature: string;
  parent_account_id?: string;
  level: number;
  is_analytical: boolean;
  accepts_cost_center: boolean;
  accepts_project: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccountWithChildren extends ChartOfAccount {
  children?: ChartOfAccountWithChildren[];
}

export const chartOfAccountsService = {
  async getAccounts(): Promise<ChartOfAccount[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('account_code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAccountsHierarchy(): Promise<ChartOfAccountWithChildren[]> {
    const accounts = await this.getAccounts();
    
    const buildTree = (parentId: string | null = null): ChartOfAccountWithChildren[] => {
      return accounts
        .filter(acc => acc.parent_account_id === parentId)
        .map(acc => ({
          ...acc,
          children: buildTree(acc.id),
        }));
    };

    return buildTree(null);
  },

  async getAccountsByType(type: string): Promise<ChartOfAccount[]> {
    const accounts = await this.getAccounts();
    return accounts.filter(acc => acc.account_type === type);
  },

  async getAnalyticalAccounts(): Promise<ChartOfAccount[]> {
    const accounts = await this.getAccounts();
    return accounts.filter(acc => acc.is_analytical && acc.status === 'Ativa');
  },

  async createAccount(account: Omit<ChartOfAccount, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<ChartOfAccount> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert([{
        ...account,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar conta contábil');
      throw error;
    }

    unifiedToast.success('Conta contábil criada com sucesso');
    return data;
  },

  async updateAccount(id: string, updates: Partial<ChartOfAccount>): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar conta contábil');
      throw error;
    }

    unifiedToast.success('Conta contábil atualizada com sucesso');
    return data;
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar conta contábil');
      throw error;
    }

    unifiedToast.success('Conta contábil deletada com sucesso');
  },

  async importStandardChartOfAccounts(): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const standardAccounts = [
      // Ativo Circulante
      { account_code: '1', account_name: 'ATIVO', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 1, is_analytical: false },
      { account_code: '1.1', account_name: 'ATIVO CIRCULANTE', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 2, is_analytical: false },
      { account_code: '1.1.1', account_name: 'Disponível', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 3, is_analytical: false },
      { account_code: '1.1.1.01', account_name: 'Caixa', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 4, is_analytical: true },
      { account_code: '1.1.1.02', account_name: 'Bancos', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 4, is_analytical: true },
      { account_code: '1.1.2', account_name: 'Contas a Receber', account_type: 'Ativo Circulante', account_nature: 'Devedora', level: 3, is_analytical: true },
      
      // Passivo Circulante
      { account_code: '2', account_name: 'PASSIVO', account_type: 'Passivo Circulante', account_nature: 'Credora', level: 1, is_analytical: false },
      { account_code: '2.1', account_name: 'PASSIVO CIRCULANTE', account_type: 'Passivo Circulante', account_nature: 'Credora', level: 2, is_analytical: false },
      { account_code: '2.1.1', account_name: 'Fornecedores', account_type: 'Passivo Circulante', account_nature: 'Credora', level: 3, is_analytical: true },
      { account_code: '2.1.2', account_name: 'Contas a Pagar', account_type: 'Passivo Circulante', account_nature: 'Credora', level: 3, is_analytical: true },
      
      // Patrimônio Líquido
      { account_code: '2.3', account_name: 'PATRIMÔNIO LÍQUIDO', account_type: 'Patrimônio Líquido', account_nature: 'Credora', level: 2, is_analytical: false },
      { account_code: '2.3.1', account_name: 'Capital Social', account_type: 'Patrimônio Líquido', account_nature: 'Credora', level: 3, is_analytical: true },
      
      // Receitas
      { account_code: '3', account_name: 'RECEITAS', account_type: 'Receitas', account_nature: 'Credora', level: 1, is_analytical: false },
      { account_code: '3.1', account_name: 'Receita Operacional', account_type: 'Receitas', account_nature: 'Credora', level: 2, is_analytical: true },
      
      // Despesas
      { account_code: '4', account_name: 'DESPESAS', account_type: 'Despesas', account_nature: 'Devedora', level: 1, is_analytical: false },
      { account_code: '4.1', account_name: 'Despesas Operacionais', account_type: 'Despesas', account_nature: 'Devedora', level: 2, is_analytical: false },
      { account_code: '4.1.1', account_name: 'Despesas Administrativas', account_type: 'Despesas', account_nature: 'Devedora', level: 3, is_analytical: true },
    ];

    const accountsToInsert = standardAccounts.map(acc => ({
      ...acc,
      company_id: profile.company_id,
      status: 'Ativa',
      accepts_cost_center: acc.is_analytical,
      accepts_project: acc.is_analytical,
    }));

    const { error } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert);

    if (error) {
      unifiedToast.error('Erro ao importar plano de contas padrão');
      throw error;
    }

    unifiedToast.success('Plano de contas padrão importado com sucesso');
  },
};
