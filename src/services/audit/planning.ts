import { supabase } from "@/integrations/supabase/client";

export type PlanningStatus = 'draft' | 'in_planning' | 'finalized' | 'locked';
export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ParticipantRole = 'lead_auditor' | 'auditor' | 'auditee' | 'observer' | 'expert';

export interface AuditSession {
  id: string;
  audit_id: string;
  name: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  auditor_id?: string;
  auditee_id?: string;
  status: SessionStatus;
  display_order: number;
  notes?: string;
  total_items: number;
  responded_items: number;
  created_at: string;
  updated_at: string;
  participants?: SessionParticipant[];
  items?: SessionItem[];
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id?: string;
  external_name?: string;
  external_email?: string;
  role: ParticipantRole;
  confirmed: boolean;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
}

export interface AuditStandardsLink {
  id: string;
  audit_id: string;
  standard_id: string;
  standard_snapshot?: any;
  display_order: number;
  created_at: string;
  standard?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface SessionItem {
  id: string;
  session_id: string;
  standard_item_id: string;
  audit_standards_link_id?: string;
  item_snapshot?: any;
  display_order: number;
  created_at: string;
  standard_item?: {
    id: string;
    item_number: string;
    title: string;
    field_type: string;
  };
}

export interface CreateSessionData {
  audit_id: string;
  name: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  auditor_id?: string;
  auditee_id?: string;
}

export interface CreateParticipantData {
  session_id: string;
  user_id?: string;
  external_name?: string;
  external_email?: string;
  role: ParticipantRole;
  notes?: string;
}

export interface AuditPlanningData {
  id: string;
  title: string;
  category_id?: string;
  template_id?: string;
  target_entity?: string;
  target_entity_type?: string;
  planning_status: PlanningStatus;
  start_date?: string;
  end_date?: string;
  lead_auditor_id?: string;
  sessions: AuditSession[];
  standards: AuditStandardsLink[];
}

class PlanningService {
  async getAuditWithPlanning(auditId: string): Promise<AuditPlanningData | null> {
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (error) throw error;
    if (!audit) return null;

    const [sessions, standards] = await Promise.all([
      this.getSessions(auditId),
      this.getAuditStandards(auditId),
    ]);

    return {
      ...audit,
      planning_status: (audit as any).planning_status || 'draft',
      sessions,
      standards,
    } as AuditPlanningData;
  }

  // Sessions
  async getSessions(auditId: string): Promise<AuditSession[]> {
    const { data, error } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('audit_id', auditId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as AuditSession[];
  }

  async getSessionWithDetails(sessionId: string): Promise<AuditSession | null> {
    const { data: session, error } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    if (!session) return null;

    const [participants, items] = await Promise.all([
      this.getSessionParticipants(sessionId),
      this.getSessionItems(sessionId),
    ]);

    return {
      ...session,
      participants,
      items,
    } as AuditSession;
  }

  async createSession(data: CreateSessionData): Promise<AuditSession> {
    // Get max display_order
    const { data: sessions } = await supabase
      .from('audit_sessions')
      .select('display_order')
      .eq('audit_id', data.audit_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = sessions && sessions.length > 0 ? sessions[0].display_order : -1;

    const { data: session, error } = await supabase
      .from('audit_sessions')
      .insert([{
        ...data,
        display_order: maxOrder + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return session as AuditSession;
  }

  async updateSession(id: string, data: Partial<CreateSessionData>): Promise<AuditSession> {
    const { data: session, error } = await supabase
      .from('audit_sessions')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return session as AuditSession;
  }

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    const { data, error } = await supabase
      .from('audit_session_participants')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return (data || []) as SessionParticipant[];
  }

  async addParticipant(data: CreateParticipantData): Promise<SessionParticipant> {
    const { data: participant, error } = await supabase
      .from('audit_session_participants')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return participant as SessionParticipant;
  }

  async removeParticipant(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_session_participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Standards Link
  async getAuditStandards(auditId: string): Promise<AuditStandardsLink[]> {
    const { data, error } = await supabase
      .from('audit_standards_link')
      .select(`
        *,
        standard:audit_standards(id, code, name)
      `)
      .eq('audit_id', auditId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as AuditStandardsLink[];
  }

  async addStandardToAudit(auditId: string, standardId: string): Promise<AuditStandardsLink> {
    const { data: existing } = await supabase
      .from('audit_standards_link')
      .select('display_order')
      .eq('audit_id', auditId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].display_order : -1;

    const { data, error } = await supabase
      .from('audit_standards_link')
      .insert([{
        audit_id: auditId,
        standard_id: standardId,
        display_order: maxOrder + 1,
      }])
      .select(`
        *,
        standard:audit_standards(id, code, name)
      `)
      .single();

    if (error) throw error;
    return data as AuditStandardsLink;
  }

  async removeStandardFromAudit(auditId: string, standardId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_standards_link')
      .delete()
      .eq('audit_id', auditId)
      .eq('standard_id', standardId);

    if (error) throw error;
  }

  // Session Items
  async getSessionItems(sessionId: string): Promise<SessionItem[]> {
    const { data, error } = await supabase
      .from('audit_session_items')
      .select(`
        *,
        standard_item:audit_standard_items(id, item_number, title, field_type)
      `)
      .eq('session_id', sessionId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as SessionItem[];
  }

  async addItemsToSession(sessionId: string, itemIds: string[], linkId?: string): Promise<void> {
    const items = itemIds.map((itemId, index) => ({
      session_id: sessionId,
      standard_item_id: itemId,
      audit_standards_link_id: linkId,
      display_order: index,
    }));

    const { error } = await supabase
      .from('audit_session_items')
      .insert(items);

    if (error) throw error;

    // Update total_items count
    await supabase
      .from('audit_sessions')
      .update({ 
        total_items: itemIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }

  async removeItemFromSession(sessionId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_session_items')
      .delete()
      .eq('session_id', sessionId)
      .eq('standard_item_id', itemId);

    if (error) throw error;
  }

  async clearSessionItems(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_session_items')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;

    await supabase
      .from('audit_sessions')
      .update({ 
        total_items: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }

  // Finalize Planning
  async finalizePlanning(auditId: string): Promise<{ success: boolean; total_items?: number; error?: string }> {
    const { data, error } = await supabase.rpc('finalize_audit_planning', {
      p_audit_id: auditId,
    });

    if (error) throw error;
    return data as { success: boolean; total_items?: number; error?: string };
  }

  // Update audit planning status
  async updatePlanningStatus(auditId: string, status: PlanningStatus): Promise<void> {
    const { error } = await supabase
      .from('audits')
      .update({
        planning_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auditId);

    if (error) throw error;
  }
}

export const planningService = new PlanningService();
