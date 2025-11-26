import { supabase } from "@/integrations/supabase/client";

export interface AuditPlan {
  id: string;
  audit_id: string;
  program_id?: string;
  company_id: string;
  objective?: string;
  scope_areas?: string[];
  criteria?: any;
  audit_type: 'first_party' | 'second_party' | 'third_party' | 'internal';
  lead_auditor_id?: string;
  team_members?: any;
  planned_date?: string;
  duration_hours?: number;
  location?: string;
  methodology?: string;
  sampling_plan?: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  opening_meeting_date?: string;
  closing_meeting_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditPlanData {
  audit_id: string;
  program_id?: string;
  objective?: string;
  scope_areas?: string[];
  criteria?: any;
  audit_type?: string;
  lead_auditor_id?: string;
  team_members?: any;
  planned_date?: string;
  duration_hours?: number;
  location?: string;
  methodology?: string;
  sampling_plan?: string;
}

export class AuditPlanService {
  async getPlanByAuditId(auditId: string): Promise<AuditPlan | null> {
    const { data, error } = await supabase
      .from('audit_plans')
      .select('*')
      .eq('audit_id', auditId)
      .maybeSingle();

    if (error) throw error;
    return data as AuditPlan | null;
  }

  async createPlan(planData: CreateAuditPlanData): Promise<AuditPlan> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_plans')
      .insert([{
        ...planData,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as AuditPlan;
  }

  async updatePlan(id: string, updates: Partial<AuditPlan>): Promise<AuditPlan> {
    const { data, error } = await supabase
      .from('audit_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AuditPlan;
  }

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const auditPlanService = new AuditPlanService();
