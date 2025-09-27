import { supabase } from '@/integrations/supabase/client';

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  objective: string;
  plan_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  created_by_user_id: string;
  items?: ActionPlanItem[];
}

export interface ActionPlanItem {
  id: string;
  action_plan_id: string;
  what_action: string;
  why_reason: string;
  where_location: string;
  when_deadline: string;
  how_method: string;
  how_much_cost: number;
  who_responsible_user_id?: string;
  status: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

export interface CreateActionPlanData {
  title: string;
  description: string;
  objective: string;
  plan_type: string;
}

export interface CreateActionPlanItemData {
  what_action: string;
  why_reason: string;
  where_location: string;
  when_deadline: string;
  how_method: string;
  how_much_cost: number;
  who_responsible_user_id?: string;
}

export interface UpdateActionPlanItemData {
  what_action?: string;
  why_reason?: string;
  where_location?: string;
  when_deadline?: string;
  how_method?: string;
  how_much_cost?: number;
  who_responsible_user_id?: string;
  status?: string;
  progress_percentage?: number;
}

class ActionPlansService {
  async getActionPlans(): Promise<ActionPlan[]> {
    const { data, error } = await supabase
      .from('action_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Get items separately for each plan
    const plansWithItems = await Promise.all(
      (data || []).map(async (plan) => {
        const items = await this.getActionPlanItems(plan.id);
        return { ...plan, items };
      })
    );
    
    return plansWithItems;
  }

  async getActionPlan(id: string): Promise<ActionPlan | null> {
    const { data, error } = await supabase
      .from('action_plans')
      .select(`
        *,
        items:action_plan_items(
          *,
          profiles:who_responsible_user_id(full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createActionPlan(planData: CreateActionPlanData): Promise<ActionPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company ID não encontrado');

    const { data, error } = await supabase
      .from('action_plans')
      .insert([{
        ...planData,
        company_id: profile.company_id,
        created_by_user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActionPlan(id: string, planData: Partial<CreateActionPlanData>): Promise<ActionPlan> {
    const { data, error } = await supabase
      .from('action_plans')
      .update(planData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActionPlanStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('action_plans')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async deleteActionPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getActionPlanItems(planId: string): Promise<ActionPlanItem[]> {
    const { data, error } = await supabase
      .from('action_plan_items')
      .select('*')
      .eq('action_plan_id', planId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createActionPlanItem(planId: string, itemData: CreateActionPlanItemData): Promise<ActionPlanItem> {
    const { data, error } = await supabase
      .from('action_plan_items')
      .insert([{
        ...itemData,
        action_plan_id: planId
      }])
      .select(`
        *,
        profiles:who_responsible_user_id(full_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateActionPlanItem(itemId: string, itemData: UpdateActionPlanItemData): Promise<ActionPlanItem> {
    const { data, error } = await supabase
      .from('action_plan_items')
      .update(itemData)
      .eq('id', itemId)
      .select(`
        *,
        profiles:who_responsible_user_id(full_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActionPlanItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('action_plan_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  async calculatePlanProgress(planId: string): Promise<number> {
    const items = await this.getActionPlanItems(planId);
    
    if (items.length === 0) return 0;
    
    const totalProgress = items.reduce((sum, item) => sum + item.progress_percentage, 0);
    return Math.round(totalProgress / items.length);
  }

  async updateItemProgress(itemId: string, progress: number): Promise<void> {
    // Update item progress
    await this.updateActionPlanItem(itemId, { 
      progress_percentage: progress,
      status: progress === 100 ? 'Concluído' : progress > 0 ? 'Em Andamento' : 'Pendente'
    });

    // Update plan progress
    const { data: item } = await supabase
      .from('action_plan_items')
      .select('action_plan_id')
      .eq('id', itemId)
      .single();

    if (item) {
      const planProgress = await this.calculatePlanProgress(item.action_plan_id);
      await supabase
        .from('action_plans')
        .update({ 
          status: planProgress === 100 ? 'Concluído' : planProgress > 0 ? 'Em Andamento' : 'Planejado'
        })
        .eq('id', item.action_plan_id);
    }
  }

  async getActionPlanStats() {
    const { data: plans, error } = await supabase
      .from('action_plans')
      .select(`
        *,
        items:action_plan_items(id, status, progress_percentage, when_deadline)
      `);

    if (error) throw error;

    const stats = {
      totalPlans: plans?.length || 0,
      activePlans: plans?.filter(p => p.status === 'Em Andamento')?.length || 0,
      completedPlans: plans?.filter(p => p.status === 'Concluído')?.length || 0,
      totalActions: 0,
      completedActions: 0,
      overdueActions: 0,
      avgProgress: 0
    };

    let totalProgress = 0;
    const today = new Date().toISOString().split('T')[0];

    plans?.forEach(plan => {
      const items = plan.items || [];
      stats.totalActions += items.length;
      
      items.forEach(item => {
        if (item.status === 'Concluído') {
          stats.completedActions++;
        }
        
        if (item.when_deadline && item.when_deadline < today && item.status !== 'Concluído') {
          stats.overdueActions++;
        }
        
        totalProgress += item.progress_percentage || 0;
      });
    });

    if (stats.totalActions > 0) {
      stats.avgProgress = Math.round(totalProgress / stats.totalActions);
    }

    return stats;
  }
}

export const actionPlansService = new ActionPlansService();