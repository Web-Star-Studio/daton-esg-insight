import { supabase } from "@/integrations/supabase/client";

// Interfaces for GED - Adjusted for Supabase types
export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content_hash?: string;
  file_path?: string;
  file_size?: number;
  changes_summary?: string;
  created_by_user_id: string;
  created_at: string;
  is_current: boolean;
  metadata?: any;
}

export interface ApprovalStep {
  id: string;
  step_number: number;
  type: 'approval' | 'review' | 'notification';
  name: string;
  description?: string;
  approver_user_ids: string[];
  required_approvals: number;
  parallel_approval: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  steps: any; // Changed to any to work with Json type
  is_active: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  workflow_id?: string;
  current_step: number;
  status: 'rascunho' | 'em_aprovacao' | 'aprovado' | 'rejeitado' | 'obsoleto';
  approver_user_id?: string;
  approval_date?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MasterListItem {
  id: string;
  company_id: string;
  document_id: string;
  code: string;
  title: string;
  version: string;
  effective_date?: string;
  review_date?: string;
  responsible_department?: string;
  distribution_list: any; // Changed to any to work with Json type
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ControlledCopy {
  id: string;
  document_id: string;
  copy_number: number;
  assigned_to_user_id?: string;
  assigned_department?: string;
  location?: string;
  status: string;
  distributed_date: string;
  last_updated: string;
  notes?: string;
}

export interface DocumentPermission {
  id: string;
  document_id?: string;
  folder_id?: string;
  user_id?: string;
  role?: string;
  permission_level: 'leitura' | 'escrita' | 'aprovacao' | 'admin';
  granted_by_user_id: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface LegalDocument {
  id: string;
  company_id: string;
  document_id?: string;
  legislation_type: string;
  law_number?: string;
  publication_date?: string;
  effective_date?: string;
  expiration_date?: string;
  issuing_authority?: string;
  subject: string;
  compliance_status: string;
  review_frequency: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bienal';
  next_review_date?: string;
  responsible_user_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditTrailEntry {
  id: string;
  document_id: string;
  action: string;
  user_id: string;
  user_ip_address?: string;
  old_values?: any;
  new_values?: any;
  timestamp: string;
  details?: string;
}

// Document Versions Service
export const documentVersionsService = {
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCurrentVersion(documentId: string): Promise<DocumentVersion | null> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar versão atual: ${error.message}`);
    return data;
  },

  async createVersion(documentId: string, versionData: Partial<DocumentVersion>): Promise<DocumentVersion> {
    const { data, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        created_by_user_id: 'current-user',
        title: 'New Version',
        version_number: 1,
        ...versionData
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar versão: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar versão');
    return data;
  }
};

// Approval Workflows Service
export const approvalWorkflowsService = {
  async getWorkflows(): Promise<any[]> {
    const { data, error } = await supabase
      .from('document_approval_workflows')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createWorkflow(workflow: any): Promise<any> {
    const { data, error } = await supabase
      .from('document_approval_workflows')
      .insert({
        ...workflow,
        steps: JSON.stringify(workflow.steps || [])
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar workflow: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar workflow');
    return data;
  },

  async updateWorkflow(id: string, updates: any): Promise<any> {
    const updateData = { ...updates };
    if (updates.steps) {
      updateData.steps = JSON.stringify(updates.steps);
    }

    const { data, error } = await supabase
      .from('document_approval_workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar workflow: ${error.message}`);
    if (!data) throw new Error('Workflow não encontrado');
    return data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_approval_workflows')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
};

// Document Approvals Service
export const documentApprovalsService = {
  async getApprovals(documentId?: string): Promise<DocumentApproval[]> {
    let query = supabase
      .from('document_approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createApproval(approval: Omit<DocumentApproval, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentApproval> {
    const { data, error } = await supabase
      .from('document_approvals')
      .insert(approval)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar aprovação: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar aprovação');
    return data;
  },

  async updateApprovalStatus(
    id: string, 
    status: DocumentApproval['status'], 
    approverUserId?: string,
    notes?: string
  ): Promise<DocumentApproval> {
    const updates: any = { 
      status,
      approver_user_id: approverUserId,
      approval_date: new Date().toISOString(),
    };

    if (status === 'aprovado') {
      updates.approval_notes = notes;
    } else if (status === 'rejeitado') {
      updates.rejection_reason = notes;
    }

    const { data, error } = await supabase
      .from('document_approvals')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar aprovação: ${error.message}`);
    if (!data) throw new Error('Aprovação não encontrada');
    return data;
  },

  async getPendingApprovals(): Promise<any[]> {
    const { data, error } = await supabase
      .from('document_approvals')
      .select(`
        *,
        documents (
          id,
          file_name,
          document_type
        )
      `)
      .eq('status', 'em_aprovacao')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// Master List Service
export const masterListService = {
  async getMasterList(): Promise<any[]> {
    const { data, error } = await supabase
      .from('document_master_list')
      .select(`
        *,
        documents (
          id,
          file_name,
          document_type,
          approval_status
        )
      `)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;
    return data || [];
  },

  async addToMasterList(item: any): Promise<any> {
    const insertData = {
      ...item,
      distribution_list: JSON.stringify(item.distribution_list || [])
    };

    const { data, error } = await supabase
      .from('document_master_list')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao adicionar à lista mestra: ${error.message}`);
    if (!data) throw new Error('Não foi possível adicionar à lista mestra');
    return data;
  },

  async updateMasterListItem(id: string, updates: any): Promise<any> {
    const updateData = { ...updates };
    if (updates.distribution_list) {
      updateData.distribution_list = JSON.stringify(updates.distribution_list);
    }

    const { data, error } = await supabase
      .from('document_master_list')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar lista mestra: ${error.message}`);
    if (!data) throw new Error('Item da lista mestra não encontrado');
    return data;
  },

  async removeFromMasterList(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_master_list')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async generateMasterListReport(): Promise<any> {
    const { data, error } = await supabase
      .from('document_master_list')
      .select(`
        *,
        documents (
          file_name,
          document_type,
          approval_status,
          effective_date
        )
      `)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;
    return data;
  }
};

// Controlled Copies Service
export const controlledCopiesService = {
  async getControlledCopies(documentId?: string): Promise<ControlledCopy[]> {
    let query = supabase
      .from('document_controlled_copies')
      .select('*')
      .order('copy_number');

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createControlledCopy(copy: Omit<ControlledCopy, 'id' | 'distributed_date' | 'last_updated'>): Promise<ControlledCopy> {
    const { data, error } = await supabase
      .from('document_controlled_copies')
      .insert(copy)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar cópia controlada: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar cópia controlada');
    return data;
  },

  async updateCopyStatus(id: string, status: string, notes?: string): Promise<ControlledCopy> {
    const { data, error } = await supabase
      .from('document_controlled_copies')
      .update({ 
        status, 
        notes,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar cópia controlada: ${error.message}`);
    if (!data) throw new Error('Cópia controlada não encontrada');
    return data;
  }
};

// Document Permissions Service
export const documentPermissionsService = {
  async getPermissions(documentId?: string, folderId?: string): Promise<DocumentPermission[]> {
    let query = supabase
      .from('document_permissions')
      .select('*')
      .eq('is_active', true);

    if (documentId) {
      query = query.eq('document_id', documentId);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async grantPermission(permission: Omit<DocumentPermission, 'id' | 'granted_at'>): Promise<DocumentPermission> {
    const { data, error } = await supabase
      .from('document_permissions')
      .insert(permission)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao conceder permissão: ${error.message}`);
    if (!data) throw new Error('Não foi possível conceder permissão');
    return data;
  },

  async revokePermission(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_permissions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
};

// Legal Documents Service
export const legalDocumentsService = {
  async getLegalDocuments(): Promise<LegalDocument[]> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createLegalDocument(document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .insert(document)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao criar documento legal: ${error.message}`);
    if (!data) throw new Error('Não foi possível criar documento legal');
    return data;
  },

  async updateLegalDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar documento legal: ${error.message}`);
    if (!data) throw new Error('Documento legal não encontrado');
    return data;
  },

  async deleteLegalDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getExpiringDocuments(days: number = 30): Promise<LegalDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// Audit Trail Service
export const auditTrailService = {
  async getAuditTrail(documentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('document_audit_trail')
      .select('*')
      .eq('document_id', documentId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async logAction(
    documentId: string,
    action: string,
    details?: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('document_audit_trail')
      .insert({
        document_id: documentId,
        action,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        details,
        old_values: oldValues,
        new_values: newValues
      });

    if (error) throw error;
  }
};

// Extended Documents Service with GED features
export const gedDocumentsService = {
  async updateDocumentGEDFields(
    documentId: string, 
    updates: {
      document_type?: 'interno' | 'externo' | 'registro' | 'legal';
      controlled_copy?: boolean;
      requires_approval?: boolean;
      approval_status?: 'rascunho' | 'em_aprovacao' | 'aprovado' | 'rejeitado' | 'obsoleto';
      master_list_included?: boolean;
      retention_period?: string;
      review_frequency?: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bienal';
      next_review_date?: string;
      effective_date?: string;
      code?: string;
      responsible_department?: string;
      distribution_list?: string[];
    }
  ): Promise<any> {
    const updateData = { ...updates };
    if (updates.distribution_list) {
    updateData.distribution_list = updates.distribution_list;
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Erro ao atualizar campos GED: ${error.message}`);
    if (!data) throw new Error('Documento não encontrado');
    return data;
  },

  async getDocumentsForReview(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDocumentsByType(type: 'interno' | 'externo' | 'registro' | 'legal'): Promise<any[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('document_type', type)
      .order('file_name');

    if (error) throw error;
    return data || [];
  }
};