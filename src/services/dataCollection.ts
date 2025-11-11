import { supabase } from "@/integrations/supabase/client";

export interface DataCollectionTask {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  frequency: 'Mensal' | 'Trimestral' | 'Anual';
  due_date: string;
  period_start: string;
  period_end: string;
  status: 'Pendente' | 'Em Atraso' | 'Concluído';
  assigned_to_user_id?: string;
  related_asset_id?: string;
  task_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  assets?: { name: string };
  profiles?: { full_name: string };
}

export interface DataImportJob {
  id: string;
  company_id: string;
  uploader_user_id: string;
  file_name: string;
  file_path: string;
  import_type: string;
  status: 'Processando' | 'Concluído' | 'Falhou';
  progress_percentage: number;
  records_processed: number;
  records_total: number;
  log: any;
  created_at: string;
  updated_at: string;
}

export const dataCollectionService = {
  async getTasks(params?: { assignee?: 'me'; status?: string }): Promise<DataCollectionTask[]> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const queryParams = new URLSearchParams();
    if (params?.assignee) queryParams.set('assignee', params.assignee);
    if (params?.status) queryParams.set('status', params.status);
    
    const url = `https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-collection-management/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch tasks: ${error}`);
    }

    return response.json();
  },

  async completeTask(taskId: string): Promise<DataCollectionTask> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const url = `https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-collection-management/complete?id=${taskId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to complete task: ${error}`);
    }

    return response.json();
  },

  async createTask(taskData: Omit<DataCollectionTask, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<DataCollectionTask> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const url = 'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-collection-management/tasks';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${error}`);
    }

    return response.json();
  },

  async getImportJobs(): Promise<DataImportJob[]> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const url = 'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/jobs';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch jobs: ${error}`);
    }

    return response.json();
  },

  async uploadFile(file: File, importType: string): Promise<{ job_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('import_type', importType);

    const response = await fetch('https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  },

  async getJobStatus(jobId: string): Promise<DataImportJob> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/jobs?id=${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get job status: ${error}`);
    }

    return response.json();
  },

  async getTemplate(type: string): Promise<{ data: any[]; fileName: string }> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/template?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get template: ${error}`);
    }

    return response.json();
  }
};