import { supabase } from "@/integrations/supabase/client";

// Retry helper for edge function calls with exponential backoff
async function invokeWithRetry<T>(
  body: Record<string, unknown>,
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('custom-forms-management', { body });
      
      if (error) {
        // Check if it's a timeout/connection error worth retrying
        const isRetryable = error.message?.includes('Failed to fetch') || 
                           error.message?.includes('502') ||
                           error.message?.includes('timeout') ||
                           error.message?.includes('NetworkError');
        
        if (isRetryable && attempt < retries) {
          console.log(`⏳ Tentativa ${attempt + 1} falhou, tentando novamente...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        throw error;
      }
      
      return data as T;
    } catch (e) {
      lastError = e as Error;
      if (attempt < retries) {
        console.log(`⏳ Tentativa ${attempt + 1} falhou, tentando novamente...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Falha após múltiplas tentativas');
}

export interface CustomForm {
  id: string;
  title: string;
  description?: string;
  structure_json: FormStructure;
  is_published: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'nps' | 'rating' | 'file' | 'message';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiselect fields
  content?: string; // For message type fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormStructure {
  fields: FormField[];
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
    logoPosition?: 'left' | 'center' | 'right';
    footerImageUrl?: string;
    footerImagePosition?: 'left' | 'center' | 'right';
  };
}

export interface FormSubmission {
  id: string;
  form_id: string;
  submission_data: Record<string, any>;
  submitted_at: string;
  submitted_by?: {
    full_name: string;
  };
}

export interface CreateFormData {
  title: string;
  description?: string;
  structure_json: FormStructure;
  is_published?: boolean;
  is_public?: boolean;
}

export interface SubmitFormData {
  submission_data: Record<string, any>;
  employee_id?: string;
  // Tracking fields
  tracking_id?: string;
  respondent_email?: string;
  respondent_name?: string;
  respondent_phone?: string;
}

export interface FormSubmissionWithEmployee extends FormSubmission {
  employee?: {
    id: string;
    full_name: string;
    employee_code: string;
  };
}

class CustomFormsService {
  async getForms(): Promise<CustomForm[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    return invokeWithRetry<CustomForm[]>({ action: 'GET_FORMS' });
  }

  async getForm(formId: string): Promise<CustomForm | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    return invokeWithRetry<CustomForm | null>({ action: 'GET_FORM', formId });
  }

  async createForm(formData: CreateFormData): Promise<CustomForm> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'CREATE_FORM',
        ...formData
      }
    });

    if (error) throw error;
    return data;
  }

  async updateForm(formId: string, formData: Partial<CreateFormData>): Promise<CustomForm> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'UPDATE_FORM',
        formId,
        ...formData
      }
    });

    if (error) throw error;
    return data;
  }

  async deleteForm(formId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'DELETE_FORM',
        formId
      }
    });

    if (error) throw error;
  }

  async submitForm(formId: string, submissionData: SubmitFormData): Promise<FormSubmission> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'SUBMIT_FORM',
        form_id: formId,
        ...submissionData
      }
    });

    if (error) throw error;
    return data;
  }

  async getEmployeeSubmissions(employeeId: string): Promise<FormSubmissionWithEmployee[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'GET_EMPLOYEE_SUBMISSIONS',
        employeeId
      }
    });

    if (error) throw error;
    return data;
  }

  async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'GET_SUBMISSIONS',
        formId
      }
    });

    if (error) throw error;
    return data;
  }

  async deleteSubmission(submissionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'DELETE_SUBMISSION',
        submissionId
      }
    });

    if (error) throw error;
  }

  // ============= PUBLIC METHODS (NO AUTH) =============

  async getPublicForm(formId: string): Promise<CustomForm | null> {
    return invokeWithRetry<CustomForm | null>({ action: 'GET_PUBLIC_FORM', formId });
  }

  async submitPublicForm(formId: string, submissionData: SubmitFormData): Promise<FormSubmission> {
    return invokeWithRetry<FormSubmission>({
      action: 'SUBMIT_PUBLIC_FORM',
      form_id: formId,
      ...submissionData
    });
  }
}

export const customFormsService = new CustomFormsService();