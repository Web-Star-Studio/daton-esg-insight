import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface Budget {
  id: string;
  company_id: string;
  year: number;
  category: string;
  department?: string;
  project_id?: string;
  planned_amount: number;
  spent_amount: number;
  monthly_breakdown?: any;
  scenario: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  totalPlanned: number;
  totalSpent: number;
  executionRate: number;
  categoriesOverBudget: string[];
  criticalCategories: Array<{
    category: string;
    planned: number;
    spent: number;
    percentage: number;
  }>;
}

export const budgetManagement = {
  async getBudgets(year?: number): Promise<Budget[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    let query = supabase
      .from('budgets')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('category', { ascending: true });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getBudgetSummary(year: number): Promise<BudgetSummary> {
    const budgets = await this.getBudgets(year);

    const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0);
    const executionRate = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

    const categoriesOverBudget = budgets
      .filter(b => Number(b.spent_amount) > Number(b.planned_amount))
      .map(b => b.category);

    const criticalCategories = budgets
      .map(b => ({
        category: b.category,
        planned: Number(b.planned_amount),
        spent: Number(b.spent_amount),
        percentage: Number(b.planned_amount) > 0 
          ? (Number(b.spent_amount) / Number(b.planned_amount)) * 100 
          : 0,
      }))
      .filter(c => c.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalPlanned,
      totalSpent,
      executionRate,
      categoriesOverBudget,
      criticalCategories,
    };
  },

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'spent_amount'>): Promise<Budget> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        ...budget,
        company_id: profile.company_id,
        spent_amount: 0,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar orçamento');
      throw error;
    }

    unifiedToast.success('Orçamento criado com sucesso');
    return data;
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar orçamento');
      throw error;
    }

    unifiedToast.success('Orçamento atualizado com sucesso');
    return data;
  },

  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar orçamento');
      throw error;
    }

    unifiedToast.success('Orçamento deletado com sucesso');
  },

  async updateSpentAmount(id: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .update({ spent_amount: amount })
      .eq('id', id);

    if (error) throw error;
  },
};
