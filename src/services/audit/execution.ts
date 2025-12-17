import { supabase } from "@/integrations/supabase/client";

export interface ItemResponse {
  id: string;
  session_item_id: string;
  audit_id: string;
  company_id: string;
  response_option_id: string | null;
  response_value: string | null;
  justification: string | null;
  strengths: string | null;
  weaknesses: string | null;
  observations: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemAttachment {
  id: string;
  response_id: string;
  audit_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AuditOccurrence {
  id: string;
  audit_id: string;
  session_id: string | null;
  session_item_id: string | null;
  response_id: string | null;
  company_id: string;
  occurrence_type: 'NC_maior' | 'NC_menor' | 'OM' | 'Observacao';
  occurrence_number: string | null;
  title: string;
  description: string;
  root_cause: string | null;
  immediate_action: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  responsible_user_id: string | null;
  due_date: string | null;
  status: 'Aberta' | 'Em_Tratamento' | 'Aguardando_Verificacao' | 'Fechada' | 'Cancelada';
  priority: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  evidence_required: boolean;
  closed_at: string | null;
  closed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const ExecutionService = {
  // ========== RESPONSES ==========
  async getResponsesByAudit(auditId: string): Promise<ItemResponse[]> {
    const { data, error } = await supabase
      .from('audit_item_responses')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getResponsesBySession(sessionId: string): Promise<ItemResponse[]> {
    const { data, error } = await supabase
      .from('audit_item_responses')
      .select(`
        *,
        audit_session_items!inner(session_id)
      `)
      .eq('audit_session_items.session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getResponseBySessionItem(sessionItemId: string): Promise<ItemResponse | null> {
    const { data, error } = await supabase
      .from('audit_item_responses')
      .select('*')
      .eq('session_item_id', sessionItemId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveResponse(response: Omit<ItemResponse, 'id' | 'created_at' | 'updated_at'>): Promise<ItemResponse> {
    // Check if response exists for this session_item
    const existing = await this.getResponseBySessionItem(response.session_item_id);
    
    if (existing) {
      const { data, error } = await supabase
        .from('audit_item_responses')
        .update({
          response_option_id: response.response_option_id,
          response_value: response.response_value,
          justification: response.justification,
          strengths: response.strengths,
          weaknesses: response.weaknesses,
          observations: response.observations,
          responded_by: response.responded_by,
          responded_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('audit_item_responses')
        .insert({
          ...response,
          responded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async deleteResponse(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_item_responses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ========== ATTACHMENTS ==========
  async getAttachmentsByResponse(responseId: string): Promise<ItemAttachment[]> {
    const { data, error } = await supabase
      .from('audit_item_attachments')
      .select('*')
      .eq('response_id', responseId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAttachmentsByAudit(auditId: string): Promise<ItemAttachment[]> {
    const { data, error } = await supabase
      .from('audit_item_attachments')
      .select('*')
      .eq('audit_id', auditId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addAttachment(attachment: Omit<ItemAttachment, 'id' | 'uploaded_at'>): Promise<ItemAttachment> {
    const { data, error } = await supabase
      .from('audit_item_attachments')
      .insert(attachment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAttachment(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_item_attachments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ========== OCCURRENCES ==========
  async getOccurrencesByAudit(auditId: string): Promise<AuditOccurrence[]> {
    const { data, error } = await supabase
      .from('audit_occurrences')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AuditOccurrence[];
  },

  async getOccurrence(id: string): Promise<AuditOccurrence | null> {
    const { data, error } = await supabase
      .from('audit_occurrences')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as AuditOccurrence | null;
  },

  async createOccurrence(occurrence: Omit<AuditOccurrence, 'id' | 'occurrence_number' | 'created_at' | 'updated_at'>): Promise<AuditOccurrence> {
    const { data, error } = await supabase
      .from('audit_occurrences')
      .insert(occurrence)
      .select()
      .single();

    if (error) throw error;
    return data as AuditOccurrence;
  },

  async updateOccurrence(id: string, updates: Partial<AuditOccurrence>): Promise<AuditOccurrence> {
    const { data, error } = await supabase
      .from('audit_occurrences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AuditOccurrence;
  },

  async deleteOccurrence(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_occurrences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async closeOccurrence(id: string, closedBy: string): Promise<AuditOccurrence> {
    const { data, error } = await supabase
      .from('audit_occurrences')
      .update({
        status: 'Fechada',
        closed_at: new Date().toISOString(),
        closed_by: closedBy,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AuditOccurrence;
  },

  // ========== EXECUTION STATS ==========
  async getExecutionStats(auditId: string): Promise<{
    totalItems: number;
    respondedItems: number;
    totalOccurrences: number;
    openOccurrences: number;
  }> {
    const [sessionsResult, occurrencesResult] = await Promise.all([
      supabase
        .from('audit_sessions')
        .select('total_items, responded_items')
        .eq('audit_id', auditId),
      supabase
        .from('audit_occurrences')
        .select('id, status')
        .eq('audit_id', auditId),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (occurrencesResult.error) throw occurrencesResult.error;

    const sessions = sessionsResult.data || [];
    const occurrences = occurrencesResult.data || [];

    return {
      totalItems: sessions.reduce((sum, s) => sum + (s.total_items || 0), 0),
      respondedItems: sessions.reduce((sum, s) => sum + (s.responded_items || 0), 0),
      totalOccurrences: occurrences.length,
      openOccurrences: occurrences.filter(o => o.status !== 'Fechada' && o.status !== 'Cancelada').length,
    };
  },
};
