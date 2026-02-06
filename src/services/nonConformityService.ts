import { supabase } from "@/integrations/supabase/client";
import { getUserAndCompany } from "@/utils/auth";

// Types
export interface NonConformity {
  id: string;
  nc_number: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  detected_date: string;
  status: string;
  current_stage: number;
  stage_1_completed_at?: string;
  stage_2_completed_at?: string;
  stage_3_completed_at?: string;
  stage_4_completed_at?: string;
  stage_5_completed_at?: string;
  stage_6_completed_at?: string;
  revision_number: number;
  parent_nc_id?: string;
  organizational_unit_id?: string;
  process_id?: string;
  damage_level?: string;
  impact_analysis?: string;
  root_cause_analysis?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  effectiveness_evaluation?: string;
  effectiveness_date?: string;
  responsible_user_id?: string;
  approved_by_user_id?: string;
  approval_date?: string;
  due_date?: string;
  completion_date?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface NCImmediateAction {
  id: string;
  non_conformity_id: string;
  company_id: string;
  description: string;
  responsible_user_id?: string;
  due_date: string;
  completion_date?: string;
  evidence?: string;
  attachments: any[];
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  responsible?: { id: string; full_name: string };
}

export interface NCCauseAnalysis {
  id: string;
  non_conformity_id: string;
  company_id: string;
  analysis_method: 'root_cause' | 'ishikawa' | '5_whys' | 'other';
  root_cause?: string;
  main_causes?: string[];
  similar_nc_ids: any;
  attachments: any;
  ishikawa_data: any;
  five_whys_data: any;
  responsible_user_id?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NCActionPlan {
  id: string;
  non_conformity_id: string;
  company_id: string;
  what_action: string;
  why_reason?: string;
  how_method?: string;
  where_location?: string;
  who_responsible_id?: string;
  when_deadline: string;
  how_much_cost?: string;
  status: 'Planejada' | 'Em Execução' | 'Concluída' | 'Cancelada';
  evidence?: string;
  attachments: any[];
  completion_date?: string;
  completed_at?: string;
  order_index: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  responsible?: { id: string; full_name: string };
}

export interface NCEffectiveness {
  id: string;
  non_conformity_id: string;
  company_id: string;
  is_effective?: boolean;
  evidence: string;
  attachments: any[];
  requires_risk_update: boolean;
  risk_update_notes?: string;
  requires_sgq_change: boolean;
  sgq_change_notes?: string;
  evaluated_by_user_id?: string;
  evaluated_at?: string;
  postponed_to?: string;
  postponed_reason?: string;
  postponed_responsible_id?: string;
  revision_number: number;
  generated_revision_nc_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NCTask {
  id: string;
  non_conformity_id: string;
  company_id: string;
  task_type: 'registration' | 'immediate_action' | 'cause_analysis' | 'planning' | 'implementation' | 'effectiveness';
  reference_id?: string;
  reference_table?: string;
  title: string;
  description?: string;
  responsible_user_id?: string;
  due_date: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada' | 'Cancelada';
  priority: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
  completed_at?: string;
  completed_by_user_id?: string;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  non_conformity?: NonConformity;
  responsible?: { id: string; full_name: string };
}

export interface NCDashboardStats {
  total_open: number;
  total_closed: number;
  by_stage: Record<string, number>;
  overdue_tasks: number;
  tasks_by_type: Record<string, number>;
}

class NonConformityService {
  private async getCompanyId(): Promise<string> {
    const userAndCompany = await getUserAndCompany();
    if (!userAndCompany?.company_id) {
      throw new Error('Company ID not found');
    }
    return userAndCompany.company_id;
  }

  // ==================== NON-CONFORMITIES ====================
  
  async getNonConformities(): Promise<NonConformity[]> {
    const companyId = await this.getCompanyId();
    const { data, error } = await supabase
      .from("non_conformities")
      .select("*")
      .eq('company_id', companyId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as NonConformity[];
  }

  async getNonConformity(id: string): Promise<NonConformity> {
    const { data, error } = await supabase
      .from("non_conformities")
      .select("*")
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as NonConformity;
  }

  async updateNonConformity(id: string, updates: Partial<NonConformity>): Promise<NonConformity> {
    const { data, error } = await supabase
      .from("non_conformities")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NonConformity;
  }

  async advanceStage(id: string, currentStage: number): Promise<NonConformity> {
    const stageCompletedField = `stage_${currentStage}_completed_at`;
    const { data, error } = await supabase
      .from("non_conformities")
      .update({
        current_stage: currentStage + 1,
        [stageCompletedField]: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NonConformity;
  }

  // ==================== IMMEDIATE ACTIONS (Etapa 2) ====================

  async getImmediateActions(ncId: string): Promise<NCImmediateAction[]> {
    const { data, error } = await supabase
      .from("nc_immediate_actions")
      .select(`
        *,
        responsible:profiles!nc_immediate_actions_responsible_user_id_fkey(id, full_name)
      `)
      .eq('non_conformity_id', ncId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data as NCImmediateAction[];
  }

  async createImmediateAction(action: Omit<NCImmediateAction, 'id' | 'created_at' | 'updated_at'>): Promise<NCImmediateAction> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_immediate_actions")
      .insert({
        ...action,
        company_id: companyId,
        created_by_user_id: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NCImmediateAction;
  }

  async updateImmediateAction(id: string, updates: Partial<NCImmediateAction>): Promise<NCImmediateAction> {
    const { data, error } = await supabase
      .from("nc_immediate_actions")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCImmediateAction;
  }

  async deleteImmediateAction(id: string): Promise<void> {
    const { error } = await supabase
      .from("nc_immediate_actions")
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==================== CAUSE ANALYSIS (Etapa 3) ====================

  async getCauseAnalysis(ncId: string): Promise<NCCauseAnalysis | null> {
    const { data, error } = await supabase
      .from("nc_cause_analysis")
      .select("*")
      .eq('non_conformity_id', ncId)
      .maybeSingle();
    
    if (error) throw error;
    return data as NCCauseAnalysis | null;
  }

  async createCauseAnalysis(analysis: Omit<NCCauseAnalysis, 'id' | 'created_at' | 'updated_at'>): Promise<NCCauseAnalysis> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_cause_analysis")
      .insert({
        ...analysis,
        company_id: companyId,
        created_by_user_id: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NCCauseAnalysis;
  }

  async updateCauseAnalysis(id: string, updates: Partial<NCCauseAnalysis>): Promise<NCCauseAnalysis> {
    const { data, error } = await supabase
      .from("nc_cause_analysis")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCCauseAnalysis;
  }

  // ==================== ACTION PLANS (Etapa 4) ====================

  async getActionPlans(ncId: string): Promise<NCActionPlan[]> {
    const { data, error } = await supabase
      .from("nc_action_plans")
      .select(`
        *,
        responsible:profiles!nc_action_plans_who_responsible_id_fkey(id, full_name)
      `)
      .eq('non_conformity_id', ncId)
      .order("order_index", { ascending: true });
    
    if (error) throw error;
    return data as NCActionPlan[];
  }

  async createActionPlan(plan: Omit<NCActionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<NCActionPlan> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_action_plans")
      .insert({
        ...plan,
        company_id: companyId,
        created_by_user_id: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NCActionPlan;
  }

  async updateActionPlan(id: string, updates: Partial<NCActionPlan>): Promise<NCActionPlan> {
    const { data, error } = await supabase
      .from("nc_action_plans")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCActionPlan;
  }

  async deleteActionPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from("nc_action_plans")
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ==================== EFFECTIVENESS (Etapa 6) ====================

  async getEffectiveness(ncId: string): Promise<NCEffectiveness | null> {
    const { data, error } = await supabase
      .from("nc_effectiveness")
      .select("*")
      .eq('non_conformity_id', ncId)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data as NCEffectiveness | null;
  }

  async createEffectiveness(effectiveness: Omit<NCEffectiveness, 'id' | 'created_at' | 'updated_at'>): Promise<NCEffectiveness> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_effectiveness")
      .insert({
        ...effectiveness,
        company_id: companyId,
        evaluated_by_user_id: user?.id,
        evaluated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NCEffectiveness;
  }

  async updateEffectiveness(id: string, updates: Partial<NCEffectiveness>): Promise<NCEffectiveness> {
    const { data, error } = await supabase
      .from("nc_effectiveness")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCEffectiveness;
  }

  // ==================== TASKS ====================

  async getTasks(filters?: {
    responsible_user_id?: string;
    task_type?: string;
    status?: string;
  }): Promise<NCTask[]> {
    const companyId = await this.getCompanyId();
    
    let query = supabase
      .from("nc_tasks")
      .select(`
        *,
        non_conformity:non_conformities(id, nc_number, title, severity),
        responsible:profiles!nc_tasks_responsible_user_id_fkey(id, full_name)
      `)
      .eq('company_id', companyId)
      .order("due_date", { ascending: true });
    
    if (filters?.responsible_user_id) {
      query = query.eq('responsible_user_id', filters.responsible_user_id);
    }
    if (filters?.task_type) {
      query = query.eq('task_type', filters.task_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as NCTask[];
  }

  async getMyTasks(): Promise<NCTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return this.getTasks({ responsible_user_id: user.id });
  }

  async createTask(task: Omit<NCTask, 'id' | 'created_at' | 'updated_at'>): Promise<NCTask> {
    const companyId = await this.getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_tasks")
      .insert({
        ...task,
        company_id: companyId,
        created_by_user_id: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as NCTask;
  }

  async updateTask(id: string, updates: Partial<NCTask>): Promise<NCTask> {
    const { data, error } = await supabase
      .from("nc_tasks")
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCTask;
  }

  async completeTask(id: string): Promise<NCTask> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("nc_tasks")
      .update({
        status: 'Concluída',
        completed_at: new Date().toISOString(),
        completed_by_user_id: user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NCTask;
  }

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats(): Promise<NCDashboardStats> {
    const companyId = await this.getCompanyId();
    
    const { data, error } = await supabase
      .rpc('get_nc_dashboard_stats', { p_company_id: companyId });
    
    if (error) throw error;
    return data as unknown as NCDashboardStats;
  }

  // ==================== USERS FOR ASSIGNMENT ====================

  async getCompanyUsers(): Promise<Array<{ id: string; full_name: string }>> {
    const companyId = await this.getCompanyId();
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq('company_id', companyId)
      .order("full_name");
    
    if (error) throw error;
    return data || [];
  }
}

export const nonConformityService = new NonConformityService();
