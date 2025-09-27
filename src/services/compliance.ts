import { supabase } from "@/integrations/supabase/client";

export interface RegulatoryRequirement {
  id: string;
  company_id: string;
  title: string;
  reference_code?: string;
  jurisdiction: 'Federal' | 'Estadual' | 'Municipal';
  summary?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceTask {
  id: string;
  company_id: string;
  requirement_id?: string;
  title: string;
  description?: string;
  frequency: 'Única' | 'Anual' | 'Semestral' | 'Trimestral' | 'Mensal' | 'Sob Demanda';
  due_date: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Em Atraso';
  responsible_user_id?: string;
  evidence_document_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  requirement?: {
    title: string;
    reference_code?: string;
  };
  responsible?: {
    full_name: string;
  };
}

export interface CreateComplianceTaskData {
  requirement_id?: string;
  title: string;
  description?: string;
  frequency: 'Única' | 'Anual' | 'Semestral' | 'Trimestral' | 'Mensal' | 'Sob Demanda';
  due_date: string;
  responsible_user_id?: string;
  notes?: string;
}

export interface UpdateComplianceTaskData {
  title?: string;
  description?: string;
  frequency?: 'Única' | 'Anual' | 'Semestral' | 'Trimestral' | 'Mensal' | 'Sob Demanda';
  due_date?: string;
  status?: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Em Atraso';
  responsible_user_id?: string;
  evidence_document_id?: string;
  notes?: string;
}

export interface CreateRegulatoryRequirementData {
  title: string;
  reference_code?: string;
  jurisdiction: 'Federal' | 'Estadual' | 'Municipal';
  summary?: string;
  source_url?: string;
}

export interface ComplianceTaskFilters {
  status?: string;
  due_in_days?: number;
  responsible?: 'me' | string;
}

export interface ComplianceStats {
  totalRequirements: number;
  totalTasks: number;
  pendingTasks: number;
  duingSoon: number;
  overdueTasks: number;
}

class ComplianceService {
  // Helper method for function calls
  private async makeRequest(method: 'GET' | 'POST' | 'PUT', path: string, body?: any) {
    const { data, error } = await supabase.functions.invoke('compliance-management', {
      body: {
        _method: method,
        _path: path,
        ...body
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Tasks methods
  async getTasks(filters: ComplianceTaskFilters = {}): Promise<ComplianceTask[]> {
    return this.makeRequest('GET', '/tasks', filters);
  }

  async createTask(taskData: CreateComplianceTaskData): Promise<ComplianceTask> {
    return this.makeRequest('POST', '/tasks', taskData);
  }

  async updateTask(taskId: string, updateData: UpdateComplianceTaskData): Promise<ComplianceTask> {
    return this.makeRequest('PUT', `/tasks/${taskId}`, updateData);
  }

  // Requirements methods
  async getRequirements(): Promise<RegulatoryRequirement[]> {
    return this.makeRequest('GET', '/requirements');
  }

  async createRequirement(requirementData: CreateRegulatoryRequirementData): Promise<RegulatoryRequirement> {
    return this.makeRequest('POST', '/requirements', requirementData);
  }

  // Stats methods
  async getStats(): Promise<ComplianceStats> {
    return this.makeRequest('GET', '/stats');
  }

  // Helper method to get users for assignment
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const complianceService = new ComplianceService();