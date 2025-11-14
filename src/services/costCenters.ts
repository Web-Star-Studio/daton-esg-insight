import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  parent_id?: string;
  department?: string;
  responsible_user_id?: string;
  budget?: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenterWithChildren extends CostCenter {
  children?: CostCenterWithChildren[];
  totalSpent?: number;
  budgetUsage?: number;
}

export const costCenters = {
  async getCostCenters(): Promise<CostCenter[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCostCenterTree(): Promise<CostCenterWithChildren[]> {
    const centers = await this.getCostCenters();
    
    // Build tree structure
    const centerMap = new Map<string, CostCenterWithChildren>();
    const rootCenters: CostCenterWithChildren[] = [];

    // First pass: create map
    centers.forEach(center => {
      centerMap.set(center.id, { ...center, children: [] });
    });

    // Second pass: build tree
    centers.forEach(center => {
      const node = centerMap.get(center.id)!;
      if (center.parent_id) {
        const parent = centerMap.get(center.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          rootCenters.push(node);
        }
      } else {
        rootCenters.push(node);
      }
    });

    return rootCenters;
  },

  async createCostCenter(
    center: Omit<CostCenter, 'id' | 'created_at' | 'updated_at' | 'company_id'>
  ): Promise<CostCenter> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('cost_centers')
      .insert([{
        ...center,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar centro de custo');
      throw error;
    }

    unifiedToast.success('Centro de custo criado com sucesso');
    return data;
  },

  async updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter> {
    const { data, error } = await supabase
      .from('cost_centers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar centro de custo');
      throw error;
    }

    unifiedToast.success('Centro de custo atualizado com sucesso');
    return data;
  },

  async deleteCostCenter(id: string): Promise<void> {
    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar centro de custo');
      throw error;
    }

    unifiedToast.success('Centro de custo deletado com sucesso');
  },

  async getCostCenterSpending(costCenterId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('cash_flow_transactions')
      .select('amount')
      .eq('cost_center_id', costCenterId)
      .eq('type', 'saida')
      .eq('status', 'realizado');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
  },
};
