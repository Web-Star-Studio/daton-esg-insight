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
    // First get the non-conformities
    const { data: ncs, error } = await supabase
      .from("non_conformities")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Then get user profiles for responsible and approved_by users
    const userIds = [...new Set([
      ...ncs.map(nc => nc.responsible_user_id).filter(Boolean),
      ...ncs.map(nc => nc.approved_by_user_id).filter(Boolean)
    ])];
    
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles = profilesData || [];
    }
    
    // Map user data to NCs
    const enrichedNCs = ncs.map(nc => ({
      ...nc,
      responsible: profiles.find(p => p.id === nc.responsible_user_id),
      approved_by: profiles.find(p => p.id === nc.approved_by_user_id)
    }));
    
    return enrichedNCs as any[];
  }

  async getNonConformity(id: string): Promise<NonConformity> {
    // First get the non-conformity
    const { data: nc, error } = await supabase
      .from("non_conformities")
      .select(`
        *,
        corrective_actions(*)
      `)
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw new Error(`Erro ao buscar não conformidade: ${error.message}`);
    if (!nc) throw new Error('Não conformidade não encontrada');
    
    // Get user profiles for responsible and approved_by users
    const userIds = [nc.responsible_user_id, nc.approved_by_user_id].filter(Boolean);
    let profiles = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles = profilesData || [];
    }
    
    // Enrich with user data
    const enrichedNC = {
      ...nc,
      responsible: profiles.find(p => p.id === nc.responsible_user_id),
      approved_by: profiles.find(p => p.id === nc.approved_by_user_id)
    };
    
    return enrichedNC as any;
  }

  async createNonConformity(ncData: CreateNonConformityData): Promise<NonConformity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
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
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar não conformidade: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar não conformidade');

    // Auto-create approval request if workflow exists
    try {
      await this.createApprovalRequest(
        "non_conformity",
        data.id,
        profile.company_id,
        user.id
      );
    } catch (approvalError) {
      // Don't fail NC creation if approval request fails
      console.warn("Could not create approval request:", approvalError);
    }

    return data as NonConformity;
  }

  async updateNonConformity(id: string, updateData: UpdateNonConformityData): Promise<NonConformity> {
    const { data, error } = await supabase
      .from("non_conformities")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar não conformidade: ${error.message}`);
    if (!data) throw new Error('Não conformidade não encontrada');
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

  // Auto-create approval request for new items
  async createApprovalRequest(
    entityType: string,
    entityId: string,
    companyId: string,
    requestedByUserId: string
  ) {
    try {
      // Find active workflow for the entity type
      const { data: workflow, error: workflowError } = await supabase
        .from("approval_workflows")
        .select("*")
        .eq("workflow_type", entityType)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .maybeSingle();

      if (workflowError) {
        console.log("Error fetching workflow:", workflowError);
        return null;
      }
      
      if (!workflow) {
        console.log("No active workflow found for", entityType);
        return null;
      }

      // Create approval request
      const { data: approvalRequest, error: requestError } = await supabase
        .from("approval_requests")
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          company_id: companyId,
          requested_by_user_id: requestedByUserId,
          workflow_id: workflow.id,
          status: "pending",
          current_step: 1
        })
        .select()
        .maybeSingle();

      if (requestError) throw new Error(`Erro ao criar solicitação de aprovação: ${requestError.message}`);
      if (!approvalRequest) throw new Error('Não foi possível criar solicitação de aprovação');

      // Create approval steps
      const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
      const approvalSteps = steps.map((step: any) => ({
        approval_request_id: approvalRequest.id,
        approver_user_id: step.approver_user_id,
        step_number: step.step_number,
        status: "pending"
      }));

      const { error: stepsError } = await supabase
        .from("approval_steps")
        .insert(approvalSteps);

      if (stepsError) throw stepsError;

      return approvalRequest;
    } catch (error) {
      console.error("Error creating approval request:", error);
      throw error;
    }
  }

  async createApprovalWorkflow(nonConformityId: string, approvers: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
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
      .maybeSingle();

    if (requestError) throw new Error(`Erro ao criar workflow de aprovação: ${requestError.message}`);
    if (!approvalRequest) throw new Error('Não foi possível criar workflow de aprovação');

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