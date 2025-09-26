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
  async getAudits(): Promise<Audit[]> {
    console.log('Fetching audits...');
    
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audits:', error);
      throw new Error(`Erro ao buscar auditorias: ${error.message}`);
    }

    console.log('Audits fetched successfully:', data?.length || 0);
    return data || [];
  }

  async createAudit(auditData: CreateAuditData): Promise<Audit> {
    console.log('Creating audit:', auditData);
    
    try {
      // Add company_id from current user's profile
      const { data: userResponse } = await supabase.auth.getUser();
      console.log('Current user:', userResponse.user?.id);
      
      if (!userResponse.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userResponse.user.id)
        .single();

      console.log('Profile data:', profile, 'Profile error:', profileError);

      if (profileError || !profile?.company_id) {
        throw new Error('Perfil do usuário não encontrado ou sem empresa associada');
      }

      const auditToInsert = {
        ...auditData,
        company_id: profile.company_id,
        status: auditData.status || 'Planejada'
      };

      console.log('Inserting audit data:', auditToInsert);

      const { data, error } = await supabase
        .from('audits')
        .insert([auditToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating audit:', error);
        throw new Error(`Erro ao criar auditoria: ${error.message}`);
      }

      console.log('Audit created successfully:', data);
      
      // Log the activity
      await this.logActivity('audit_created', `Auditoria criada: ${data.title}`, {
        audit_id: data.id,
        audit_type: data.audit_type
      });

      return data;
    } catch (error) {
      console.error('Detailed audit creation error:', error);
      throw error;
    }
  }

  async getAuditFindings(auditId: string): Promise<AuditFinding[]> {
    console.log('Fetching audit findings for audit:', auditId);
    
    const { data, error } = await supabase
      .from('audit_findings')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit findings:', error);
      throw new Error(`Erro ao buscar achados da auditoria: ${error.message}`);
    }

    console.log('Audit findings fetched successfully:', data?.length || 0);
    return data || [];
  }

  async createAuditFinding(auditId: string, findingData: CreateFindingData): Promise<AuditFinding> {
    console.log('Creating audit finding:', auditId, findingData);
    
    try {
      const findingToInsert = {
        ...findingData,
        audit_id: auditId,
        status: 'Aberta'
      };

      console.log('Inserting finding data:', findingToInsert);

      const { data, error } = await supabase
        .from('audit_findings')
        .insert([findingToInsert])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating audit finding:', error);
        throw new Error(`Erro ao criar achado da auditoria: ${error.message}`);
      }

      console.log('Audit finding created successfully:', data);
      
      // Log the activity
      await this.logActivity('audit_finding_created', `Achado criado para auditoria: ${findingData.description}`, {
        audit_id: auditId,
        finding_id: data.id,
        severity: findingData.severity
      });

      return data;
    } catch (error) {
      console.error('Detailed finding creation error:', error);
      throw error;
    }
  }

  async updateAuditFinding(findingId: string, updateData: UpdateFindingData): Promise<AuditFinding> {
    console.log('Updating audit finding:', findingId, updateData);
    
    const { data, error } = await supabase
      .from('audit_findings')
      .update(updateData)
      .eq('id', findingId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating audit finding:', error);
      throw new Error(`Erro ao atualizar achado da auditoria: ${error.message}`);
    }

    console.log('Audit finding updated successfully:', data);
    return data;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    console.log('Fetching activity logs...');
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activity logs:', error);
      throw new Error(`Erro ao buscar logs de atividade: ${error.message}`);
    }

    console.log('Activity logs fetched successfully:', data?.length || 0);
    return data || [];
  }

  async logActivity(actionType: string, description: string, detailsJson?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const result = await supabase.rpc('log_activity', {
        p_company_id: profile.company_id,
        p_user_id: user.id,
        p_action_type: actionType,
        p_description: description,
        p_details_json: detailsJson
      });

      console.log('Activity logged successfully:', actionType);
      return result;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async getAuditTrail(filters: AuditTrailFilters = {}) {
    console.log('Fetching audit trail with filters:', filters);
    
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.action_type) {
      query = query.eq('action_type', filters.action_type);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit trail:', error);
      throw new Error(`Erro ao buscar trilha de auditoria: ${error.message}`);
    }

    console.log('Audit trail fetched successfully:', data?.length || 0);
    return data || [];
  }
}

export const auditService = new AuditService();