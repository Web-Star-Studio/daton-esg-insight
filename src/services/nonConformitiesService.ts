import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
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
  approval_notes?: string;
  attachments?: any[];
  due_date?: string;
  completion_date?: string;
  recurrence_count?: number;
  responsible?: { full_name: string };
  approved_by?: { full_name: string };
}

export interface CreateNonConformityData {
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  detected_date: string;
  damage_level?: string;
  responsible_user_id?: string;
}

export interface UpdateNonConformityData {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  source?: string;
  detected_date?: string;
  status?: string;
  damage_level?: string;
  impact_analysis?: string;
  root_cause_analysis?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  effectiveness_evaluation?: string;
  effectiveness_date?: string;
  responsible_user_id?: string;
  due_date?: string;
  completion_date?: string;
}

class NonConformitiesService {
  async getNonConformities(): Promise<NonConformity[]> {
    const { data, error } = await supabase
      .from("non_conformities")
      .select(`
        *,
        responsible:responsible_user_id(full_name),
        approved_by:approved_by_user_id(full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as any[];
  }

  async getNonConformity(id: string): Promise<NonConformity> {
    const { data, error } = await supabase
      .from("non_conformities")
      .select(`
        *,
        responsible:responsible_user_id(full_name),
        approved_by:approved_by_user_id(full_name),
        corrective_actions(*)
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data as any;
  }

  async createNonConformity(ncData: CreateNonConformityData): Promise<NonConformity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    // Generate NC number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    const nc_number = `NC-${year}${month}${day}-${timestamp}`;

    const { data, error } = await supabase
      .from("non_conformities")
      .insert([{
        ...ncData,
        nc_number,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as NonConformity;
  }

  async updateNonConformity(id: string, updateData: UpdateNonConformityData): Promise<NonConformity> {
    const { data, error } = await supabase
      .from("non_conformities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as NonConformity;
  }

  async deleteNonConformity(id: string): Promise<void> {
    const { error } = await supabase
      .from("non_conformities")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async getTimeline(nonConformityId: string) {
    const { data, error } = await supabase
      .from("non_conformity_timeline")
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .eq("non_conformity_id", nonConformityId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getDashboardStats() {
    const { data: nonConformities, error } = await supabase
      .from("non_conformities")
      .select("*");

    if (error) throw error;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month stats
    const currentMonthNCs = nonConformities.filter(nc => {
      const ncDate = new Date(nc.created_at);
      return ncDate.getMonth() === currentMonth && ncDate.getFullYear() === currentYear;
    });

    // Last month stats
    const lastMonthNCs = nonConformities.filter(nc => {
      const ncDate = new Date(nc.created_at);
      return ncDate.getMonth() === lastMonth && ncDate.getFullYear() === lastMonthYear;
    });

    // Calculate trends
    const currentMonthCount = currentMonthNCs.length;
    const lastMonthCount = lastMonthNCs.length;
    const trend = lastMonthCount === 0 
      ? (currentMonthCount > 0 ? 100 : 0)
      : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;

    // Stats by severity
    const bySeverity = nonConformities.reduce((acc, nc) => {
      acc[nc.severity] = (acc[nc.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Stats by status
    const byStatus = nonConformities.reduce((acc, nc) => {
      acc[nc.status] = (acc[nc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Stats by source
    const bySource = nonConformities.reduce((acc, nc) => {
      acc[nc.source] = (acc[nc.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Resolution rate
    const totalNCs = nonConformities.length;
    const resolvedNCs = nonConformities.filter(nc => nc.status === 'Fechada').length;
    const resolutionRate = totalNCs > 0 ? (resolvedNCs / totalNCs) * 100 : 0;

    // Overdue NCs
    const overdueNCs = nonConformities.filter(nc => {
      if (!nc.due_date || nc.status === 'Fechada') return false;
      return new Date(nc.due_date) < now;
    });

    return {
      metrics: {
        total: totalNCs,
        currentMonth: currentMonthCount,
        trend,
        resolutionRate,
        overdue: overdueNCs.length,
        critical: nonConformities.filter(nc => nc.severity === 'Crítica' && nc.status !== 'Fechada').length
      },
      charts: {
        severity: Object.entries(bySeverity).map(([key, value]) => ({ name: key, value })),
        status: Object.entries(byStatus).map(([key, value]) => ({ name: key, value })),
        source: Object.entries(bySource).map(([key, value]) => ({ name: key, value }))
      }
    };
  }

  async createApprovalWorkflow(nonConformityId: string, approvers: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID não encontrado");

    // Create approval request
    const { data: approvalRequest, error: requestError } = await supabase
      .from("approval_requests")
      .insert({
        company_id: profile.company_id,
        workflow_id: "default", // You could create different workflows
        entity_type: "non_conformity",
        entity_id: nonConformityId,
        requested_by_user_id: user.id
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Create approval steps
    const steps = approvers.map((approverId, index) => ({
      approval_request_id: approvalRequest.id,
      step_number: index + 1,
      approver_user_id: approverId
    }));

    const { error: stepsError } = await supabase
      .from("approval_steps")
      .insert(steps);

    if (stepsError) throw stepsError;

    return approvalRequest;
  }
}

export const nonConformitiesService = new NonConformitiesService();