import { supabase } from "@/integrations/supabase/client";

export interface AuditProgram {
  id: string;
  company_id: string;
  title: string;
  year: number;
  objectives?: string;
  scope_description?: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  responsible_user_id?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  risk_criteria?: any;
  resources_budget?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditProgramData {
  title: string;
  year: number;
  objectives?: string;
  scope_description?: string;
  start_date: string;
  end_date: string;
  responsible_user_id?: string;
  risk_criteria?: any;
  resources_budget?: number;
}

export class AuditProgramService {
  async getPrograms(): Promise<AuditProgram[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_programs')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('year', { ascending: false });

    if (error) throw error;
    return (data || []) as AuditProgram[];
  }

  async getProgramById(id: string): Promise<AuditProgram> {
    const { data, error } = await supabase
      .from('audit_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditProgram;
  }

  async createProgram(programData: CreateAuditProgramData): Promise<AuditProgram> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_programs')
      .insert([{
        ...programData,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as AuditProgram;
  }

  async updateProgram(id: string, updates: Partial<AuditProgram>): Promise<AuditProgram> {
    const { data, error } = await supabase
      .from('audit_programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AuditProgram;
  }

  async deleteProgram(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async approveProgram(id: string): Promise<AuditProgram> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    return this.updateProgram(id, {
      approved_by_user_id: userId,
      approved_at: new Date().toISOString(),
      status: 'in_progress',
    });
  }
}

export const auditProgramService = new AuditProgramService();
