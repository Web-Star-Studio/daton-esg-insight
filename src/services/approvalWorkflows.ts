import { supabase } from '@/integrations/supabase/client';
import { unifiedToast } from '@/utils/unifiedToast';

export interface ApprovalWorkflow {
  id: string;
  company_id: string;
  workflow_name: string;
  workflow_type: string;
  steps: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  company_id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  requested_by_user_id: string;
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  id: string;
  approval_request_id: string;
  step_number: number;
  approver_user_id: string;
  status: string;
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export const approvalWorkflowsService = {
  async getWorkflows(): Promise<ApprovalWorkflow[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('workflow_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActiveWorkflow(workflowType: string): Promise<ApprovalWorkflow | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('workflow_type', workflowType)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<ApprovalWorkflow> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('approval_workflows')
      .insert([{
        ...workflow,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar workflow de aprovação');
      throw error;
    }

    unifiedToast.success('Workflow de aprovação criado com sucesso');
    return data;
  },

  async updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
    const { data, error } = await supabase
      .from('approval_workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao atualizar workflow');
      throw error;
    }

    unifiedToast.success('Workflow atualizado com sucesso');
    return data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('approval_workflows')
      .delete()
      .eq('id', id);

    if (error) {
      unifiedToast.error('Erro ao deletar workflow');
      throw error;
    }

    unifiedToast.success('Workflow deletado com sucesso');
  },

  // Approval Requests
  async getPendingRequests(): Promise<ApprovalRequest[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('company_id', profile.company_id)
      .in('status', ['Pendente', 'Em Análise'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRequestsByEntity(entityType: string, entityId: string): Promise<ApprovalRequest[]> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<ApprovalRequest> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('approval_requests')
      .insert([{
        ...request,
        company_id: profile.company_id,
      }])
      .select()
      .single();

    if (error) {
      unifiedToast.error('Erro ao criar requisição de aprovação');
      throw error;
    }

    return data;
  },

  async approveRequest(requestId: string, stepNumber: number, comments?: string): Promise<void> {
    const { data: request } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Requisição não encontrada');

    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Registrar step
    const { error: stepError } = await supabase
      .from('approval_steps')
      .insert([{
        approval_request_id: requestId,
        step_number: stepNumber,
        approver_user_id: userId,
        status: 'Aprovado',
        comments,
        approved_at: new Date().toISOString(),
      }]);

    if (stepError) {
      unifiedToast.error('Erro ao registrar aprovação');
      throw stepError;
    }

    // Atualizar request
    const newStep = stepNumber + 1;
    const { error: updateError } = await supabase
      .from('approval_requests')
      .update({
        current_step: newStep,
        status: 'Aprovado',
      })
      .eq('id', requestId);

    if (updateError) {
      unifiedToast.error('Erro ao atualizar requisição');
      throw updateError;
    }

    unifiedToast.success('Aprovação registrada com sucesso');
  },

  async rejectRequest(requestId: string, stepNumber: number, comments?: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Registrar step
    const { error: stepError } = await supabase
      .from('approval_steps')
      .insert([{
        approval_request_id: requestId,
        step_number: stepNumber,
        approver_user_id: userId,
        status: 'Rejeitado',
        comments,
        approved_at: new Date().toISOString(),
      }]);

    if (stepError) {
      unifiedToast.error('Erro ao registrar rejeição');
      throw stepError;
    }

    // Atualizar request
    const { error: updateError } = await supabase
      .from('approval_requests')
      .update({
        status: 'Rejeitado',
      })
      .eq('id', requestId);

    if (updateError) {
      unifiedToast.error('Erro ao atualizar requisição');
      throw updateError;
    }

    unifiedToast.warning('Requisição rejeitada');
  },

  async getRequestSteps(requestId: string): Promise<ApprovalStep[]> {
    const { data, error } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('approval_request_id', requestId)
      .order('step_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
