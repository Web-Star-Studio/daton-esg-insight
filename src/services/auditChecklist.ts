import { supabase } from "@/integrations/supabase/client";

export type ISOStandard = 'ISO_9001' | 'ISO_14001' | 'ISO_39001' | 'ISO_45001' | 'Custom';
export type ResponseType = 'conforming' | 'non_conforming' | 'not_applicable' | 'observation' | 'opportunity';

export interface ChecklistQuestion {
  id: string;
  text: string;
  clause: string;
  category: string;
  guidance?: string;
}

export interface AuditChecklist {
  id: string;
  company_id: string;
  name: string;
  standard: ISOStandard;
  version?: string;
  clause_reference?: string;
  questions: ChecklistQuestion[];
  is_template: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistResponse {
  id: string;
  audit_id: string;
  checklist_id: string;
  question_id: string;
  response: ResponseType;
  evidence_notes?: string;
  evidence_documents?: any;
  auditor_id?: string;
  audited_by?: string;
  response_date: string;
  created_at: string;
  updated_at: string;
}

export class AuditChecklistService {
  async getChecklists(): Promise<AuditChecklist[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_checklists')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AuditChecklist[];
  }

  async getTemplates(): Promise<AuditChecklist[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_checklists')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_template', true)
      .eq('active', true)
      .order('standard');

    if (error) throw error;
    return (data || []) as unknown as AuditChecklist[];
  }

  async getChecklistsByStandard(standard: ISOStandard): Promise<AuditChecklist[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_checklists')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('standard', standard)
      .eq('active', true);

    if (error) throw error;
    return (data || []) as unknown as AuditChecklist[];
  }

  async createChecklist(checklist: Omit<AuditChecklist, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<AuditChecklist> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_checklists')
      .insert([{
        ...checklist,
        questions: checklist.questions as any,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AuditChecklist;
  }

  async getResponsesByAudit(auditId: string): Promise<ChecklistResponse[]> {
    const { data, error } = await supabase
      .from('audit_checklist_responses')
      .select('*')
      .eq('audit_id', auditId)
      .order('response_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ChecklistResponse[];
  }

  async createResponse(response: Omit<ChecklistResponse, 'id' | 'created_at' | 'updated_at'>): Promise<ChecklistResponse> {
    const { data, error } = await supabase
      .from('audit_checklist_responses')
      .insert([response])
      .select()
      .single();

    if (error) throw error;
    return data as ChecklistResponse;
  }

  async updateResponse(id: string, updates: Partial<ChecklistResponse>): Promise<ChecklistResponse> {
    const { data, error } = await supabase
      .from('audit_checklist_responses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ChecklistResponse;
  }
}

export const auditChecklistService = new AuditChecklistService();
