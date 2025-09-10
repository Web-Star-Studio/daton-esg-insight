import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id: string;
  action_type: string;
  description: string;
  details_json?: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export interface Audit {
  id: string;
  company_id: string;
  title: string;
  audit_type: string;
  auditor?: string;
  start_date?: string;
  end_date?: string;
  scope?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  description: string;
  severity: string;
  status: string;
  responsible_user_id?: string;
  due_date?: string;
  action_plan?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

export interface CreateAuditData {
  title: string;
  audit_type: string;
  auditor?: string;
  start_date?: string;
  end_date?: string;
  scope?: string;
  status?: string;
}

export interface CreateFindingData {
  description: string;
  severity: string;
  responsible_user_id?: string;
  due_date?: string;
  action_plan?: string;
}

export interface UpdateFindingData {
  description?: string;
  severity?: string;
  status?: string;
  responsible_user_id?: string;
  due_date?: string;
  action_plan?: string;
}

export interface AuditTrailFilters {
  user_id?: string;
  action_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

class AuditService {
  private getAuthHeaders() {
    const token = supabase.auth.getSession().then(({ data: { session } }) => session?.access_token);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async getAuditTrail(filters: AuditTrailFilters = {}) {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { data, error } = await supabase.functions.invoke('audit-management', {
      body: null,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    return data;
  }

  async getAudits(): Promise<Audit[]> {
    const { data, error } = await supabase.functions.invoke('audit-management/audits', {
      method: 'GET'
    });

    if (error) throw error;
    return data;
  }

  async createAudit(auditData: CreateAuditData): Promise<Audit> {
    const { data, error } = await supabase.functions.invoke('audit-management/audits', {
      body: auditData,
      method: 'POST'
    });

    if (error) throw error;
    return data;
  }

  async getAuditFindings(auditId: string): Promise<AuditFinding[]> {
    const { data, error } = await supabase.functions.invoke(`audit-management/audits/${auditId}/findings`, {
      method: 'GET'
    });

    if (error) throw error;
    return data;
  }

  async createAuditFinding(auditId: string, findingData: CreateFindingData): Promise<AuditFinding> {
    const { data, error } = await supabase.functions.invoke(`audit-management/audits/${auditId}/findings`, {
      body: findingData,
      method: 'POST'
    });

    if (error) throw error;
    return data;
  }

  async updateAuditFinding(findingId: string, updateData: UpdateFindingData): Promise<AuditFinding> {
    const { data, error } = await supabase.functions.invoke(`audit-management/findings/${findingId}`, {
      body: updateData,
      method: 'PUT'
    });

    if (error) throw error;
    return data;
  }

  async logActivity(actionType: string, description: string, detailsJson?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    if (!user || !profile) return;

    return supabase.rpc('log_activity', {
      p_company_id: profile.company_id,
      p_user_id: user.id,
      p_action_type: actionType,
      p_description: description,
      p_details_json: detailsJson
    });
  }
}

export const auditService = new AuditService();