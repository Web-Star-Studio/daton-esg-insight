import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Json } from "@/integrations/supabase/types";

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id: string;
  action_type: string;
  description: string;
  details_json?: Json;
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
    logger.debug('Fetching audits', 'audit');
    
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching audits', error, 'audit');
      throw new Error(`Erro ao buscar auditorias: ${error.message}`);
    }

    logger.debug('Audits fetched successfully', 'audit', { count: data?.length || 0 });
    return data || [];
  }

  async createAudit(auditData: CreateAuditData): Promise<Audit> {
    logger.debug('Creating audit', 'audit', { auditData });
    
    try {
      // Add company_id from current user's profile
      const { data: userResponse } = await supabase.auth.getUser();
      logger.debug('Getting current user', 'audit', { userId: userResponse.user?.id });
      
      if (!userResponse.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userResponse.user.id)
        .maybeSingle();

      logger.debug('Profile data retrieved', 'audit');

      if (profileError) {
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }
      
      if (!profile?.company_id) {
        throw new Error('Perfil do usuário não encontrado ou sem empresa associada');
      }

      const auditToInsert = {
        ...auditData,
        company_id: profile.company_id,
        status: auditData.status || 'Planejada'
      };

      logger.debug('Inserting audit data', 'audit');

      const { data, error } = await supabase
        .from('audits')
        .insert([auditToInsert])
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Error creating audit', error, 'audit');
        throw new Error(`Erro ao criar auditoria: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Não foi possível criar a auditoria');
      }

      logger.debug('Audit created successfully', 'audit', { auditId: data.id });
      
      // Log the activity
      await this.logActivity('audit_created', `Auditoria criada: ${data.title}`, {
        audit_id: data.id,
        audit_type: data.audit_type
      });

      return data;
    } catch (error) {
      logger.error('Detailed audit creation error', error, 'audit');
      throw error;
    }
  }

  async getAuditFindings(auditId: string): Promise<AuditFinding[]> {
    logger.debug('Fetching audit findings', 'audit', { auditId });
    
    const { data, error } = await supabase
      .from('audit_findings')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching audit findings', error, 'audit');
      throw new Error(`Erro ao buscar achados da auditoria: ${error.message}`);
    }

    logger.debug('Audit findings fetched successfully', 'audit', { count: data?.length || 0 });
    return data || [];
  }

  async createAuditFinding(auditId: string, findingData: CreateFindingData): Promise<AuditFinding> {
    logger.debug('Creating audit finding', 'audit', { auditId, findingData });
    
    try {
      const findingToInsert = {
        ...findingData,
        audit_id: auditId,
        status: 'Aberta'
      };

      logger.debug('Inserting finding data', 'audit');

      const { data, error } = await supabase
        .from('audit_findings')
        .insert([findingToInsert])
        .select('*')
        .maybeSingle();

      if (error) {
        logger.error('Error creating audit finding', error, 'audit');
        throw new Error(`Erro ao criar achado da auditoria: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Não foi possível criar o achado da auditoria');
      }

      logger.debug('Audit finding created successfully', 'audit', { findingId: data.id });
      
      // Log the activity
      await this.logActivity('audit_finding_created', `Achado criado para auditoria: ${findingData.description}`, {
        audit_id: auditId,
        finding_id: data.id,
        severity: findingData.severity
      });

      return data;
    } catch (error) {
      logger.error('Detailed finding creation error', error, 'audit');
      throw error;
    }
  }

  async updateAudit(auditId: string, auditData: CreateAuditData): Promise<Audit> {
    logger.debug('Updating audit', 'audit', { auditId, auditData });

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, id')
      .single();

    if (!profile?.company_id) {
      throw new Error('Company ID não encontrado');
    }

    const { data: session } = await supabase.auth.getSession();
    
    const response = await fetch(
      `https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/audit-management?action=update-audit&audit_id=${auditId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify(auditData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar auditoria');
    }

    const data = await response.json();
    
    // Log the activity
    await this.logActivity('audit_updated', `Auditoria atualizada: ${data.title}`, {
      audit_id: data.id,
      audit_type: data.audit_type
    });

    return data;
  }

  async updateAuditFinding(findingId: string, updateData: UpdateFindingData): Promise<AuditFinding> {
    logger.debug('Updating audit finding', 'audit', { findingId, updateData });
    
    const { data, error } = await supabase
      .from('audit_findings')
      .update(updateData)
      .eq('id', findingId)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Error updating audit finding', error, 'audit');
      throw new Error(`Erro ao atualizar achado da auditoria: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Achado da auditoria não encontrado');
    }

    logger.debug('Audit finding updated successfully', 'audit', { findingId: data.id });
    return data;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    logger.debug('Fetching activity logs', 'audit');
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching activity logs', error, 'audit');
      throw new Error(`Erro ao buscar logs de atividade: ${error.message}`);
    }

    logger.debug('Activity logs fetched successfully', 'audit', { count: data?.length || 0 });
    return data || [];
  }

  async logActivity(actionType: string, description: string, detailsJson?: Json) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) return;

      const result = await supabase.rpc('log_activity', {
        p_company_id: profile.company_id,
        p_user_id: user.id,
        p_action_type: actionType,
        p_description: description,
        p_details_json: detailsJson
      });

      logger.debug('Activity logged successfully', 'audit', { actionType });
      return result;
    } catch (error) {
      logger.error('Error logging activity', error, 'audit');
    }
  }

  async getAuditTrail(filters: AuditTrailFilters = {}) {
    logger.debug('Fetching audit trail', 'audit', { filters });
    
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
      logger.error('Error fetching audit trail', error, 'audit');
      throw new Error(`Erro ao buscar trilha de auditoria: ${error.message}`);
    }

    logger.debug('Audit trail fetched successfully', 'audit', { count: data?.length || 0 });
    return data || [];
  }

  async getAllFindings(): Promise<AuditFinding[]> {
    logger.debug('Fetching all audit findings', 'audit');
    
    const { data, error } = await supabase
      .from('audit_findings')
      .select(`
        *,
        profiles!audit_findings_responsible_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching all findings', error, 'audit');
      throw new Error(`Erro ao buscar achados de auditoria: ${error.message}`);
    }

    logger.debug('All findings fetched successfully', 'audit', { count: data?.length || 0 });
    return data || [];
  }
}

export const auditService = new AuditService();
