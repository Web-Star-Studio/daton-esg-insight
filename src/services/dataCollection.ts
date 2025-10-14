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
    const { data, error } = await supabase.functions.invoke('data-collection-management', {
      body: { action: 'getTasks', ...params }
    });

    if (error) throw error;
    return data || [];
  },

  async completeTask(taskId: string): Promise<DataCollectionTask> {
    const { data, error } = await supabase.functions.invoke('data-collection-management', {
      body: { action: 'completeTask', taskId }
    });

    if (error) throw error;
    return data[0];
  },

  async createTask(taskData: Omit<DataCollectionTask, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<DataCollectionTask> {
    const { data, error } = await supabase.functions.invoke('data-collection-management', {
      body: taskData,
      method: 'POST'
    });

    if (error) throw error;
    return data[0];
  },

  async getImportJobs(): Promise<DataImportJob[]> {
    const { data, error } = await supabase.functions.invoke('data-import-processor', {
      body: { action: 'getJobs' }
    });

    if (error) throw error;
    return data || [];
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
    const response = await fetch(`https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/jobs/${jobId}/status`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    return response.json();
  },

  async getTemplate(type: string): Promise<{ data: any[]; fileName: string }> {
    const response = await fetch(`https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/data-import-processor/template/${type}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get template');
    }

    return response.json();
  }
};