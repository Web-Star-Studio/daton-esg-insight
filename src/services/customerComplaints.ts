import { supabase } from "@/integrations/supabase/client";

export interface CustomerComplaint {
  id: string;
  company_id: string;
  complaint_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  complaint_type: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  assigned_to_user_id?: string;
  resolution_target_date?: string;
  resolution_date?: string;
  resolution_description?: string;
  customer_satisfaction_rating?: number;
  customer_satisfaction_feedback?: string;
  communication_log?: any;
  attachments?: any;
  sla_met?: boolean;
  escalated: boolean;
  escalation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerComplaintData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  complaint_type: string;
  category: string;
  priority?: string;
  subject: string;
  description: string;
  assigned_to_user_id?: string;
  attachments?: any;
}

export const getCustomerComplaints = async (filters?: {
  status?: string;
  priority?: string;
  category?: string;
}): Promise<CustomerComplaint[]> => {
  try {
    let query = supabase
      .from('customer_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customer complaints:', error);
    throw error;
  }
};

export const getCustomerComplaintById = async (id: string): Promise<CustomerComplaint | null> => {
  try {
    const { data, error } = await supabase
      .from('customer_complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer complaint:', error);
    throw error;
  }
};

export const createCustomerComplaint = async (complaintData: CreateCustomerComplaintData): Promise<CustomerComplaint> => {
  try {
    // Generate complaint number
    const count = await getComplaintsCount() + 1;
    const complaint_number = `RCL-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    // Get user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    const { data, error } = await supabase
      .from('customer_complaints')
      .insert({
        ...complaintData,
        complaint_number,
        company_id: profile?.company_id,
        communication_log: [{
          date: new Date().toISOString(),
          type: 'creation',
          message: 'Reclamação registrada no sistema',
          user_id: null
        }]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating customer complaint:', error);
    throw error;
  }
};

export const updateCustomerComplaint = async (id: string, updates: Partial<CustomerComplaint>): Promise<CustomerComplaint> => {
  try {
    const { data, error } = await supabase
      .from('customer_complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating customer complaint:', error);
    throw error;
  }
};

export const addCommunicationLog = async (id: string, message: string, userId?: string): Promise<CustomerComplaint> => {
  try {
    const complaint = await getCustomerComplaintById(id);
    if (!complaint) throw new Error('Complaint not found');

    const communication_log = complaint.communication_log || [];
    communication_log.push({
      date: new Date().toISOString(),
      type: 'communication',
      message,
      user_id: userId
    });

    return await updateCustomerComplaint(id, { communication_log });
  } catch (error) {
    console.error('Error adding communication log:', error);
    throw error;
  }
};

export const resolveComplaint = async (
  id: string,
  resolutionDescription: string,
  userId?: string
): Promise<CustomerComplaint> => {
  try {
    const updates = {
      status: 'Resolvida',
      resolution_date: new Date().toISOString().split('T')[0],
      resolution_description: resolutionDescription
    };

    const resolvedComplaint = await updateCustomerComplaint(id, updates);
    
    // Add resolution to communication log
    await addCommunicationLog(id, `Reclamação resolvida: ${resolutionDescription}`, userId);

    return resolvedComplaint;
  } catch (error) {
    console.error('Error resolving complaint:', error);
    throw error;
  }
};

export const escalateComplaint = async (id: string, reason: string, userId?: string): Promise<CustomerComplaint> => {
  try {
    const updates = {
      escalated: true,
      escalation_reason: reason,
      priority: 'Alta',
      status: 'Escalada'
    };

    const escalatedComplaint = await updateCustomerComplaint(id, updates);
    
    // Add escalation to communication log
    await addCommunicationLog(id, `Reclamação escalada: ${reason}`, userId);

    return escalatedComplaint;
  } catch (error) {
    console.error('Error escalating complaint:', error);
    throw error;
  }
};

export const rateComplaintResolution = async (
  id: string,
  rating: number,
  feedback?: string
): Promise<CustomerComplaint> => {
  try {
    const updates = {
      customer_satisfaction_rating: rating,
      customer_satisfaction_feedback: feedback
    };

    return await updateCustomerComplaint(id, updates);
  } catch (error) {
    console.error('Error rating complaint resolution:', error);
    throw error;
  }
};

const getComplaintsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('customer_complaints')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting complaints count:', error);
    return 0;
  }
};

export const getComplaintsStats = async () => {
  try {
    const { data: complaints, error } = await supabase
      .from('customer_complaints')
      .select('*');

    if (error) throw error;

    const stats = {
      total: complaints?.length || 0,
      open: complaints?.filter(c => ['Aberta', 'Em Análise', 'Escalada'].includes(c.status)).length || 0,
      resolved: complaints?.filter(c => c.status === 'Resolvida').length || 0,
      high_priority: complaints?.filter(c => c.priority === 'Alta').length || 0,
      escalated: complaints?.filter(c => c.escalated).length || 0,
      avg_satisfaction: 0,
      sla_compliance: 0
    };

    // Calculate average satisfaction
    const ratedComplaints = complaints?.filter(c => c.customer_satisfaction_rating) || [];
    if (ratedComplaints.length > 0) {
      stats.avg_satisfaction = ratedComplaints.reduce((sum, c) => sum + (c.customer_satisfaction_rating || 0), 0) / ratedComplaints.length;
    }

    // Calculate SLA compliance
    const resolvedComplaints = complaints?.filter(c => c.status === 'Resolvida') || [];
    const slaMetCount = resolvedComplaints.filter(c => c.sla_met).length;
    if (resolvedComplaints.length > 0) {
      stats.sla_compliance = (slaMetCount / resolvedComplaints.length) * 100;
    }

    return stats;
  } catch (error) {
    console.error('Error calculating complaints stats:', error);
    throw error;
  }
};