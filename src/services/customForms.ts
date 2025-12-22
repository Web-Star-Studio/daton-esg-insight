import { supabase } from "@/integrations/supabase/client";

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
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiselect fields
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

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: { action: 'GET_FORMS' }
    });

    if (error) throw error;
    return data;
  }

  async getForm(formId: string): Promise<CustomForm | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: { action: 'GET_FORM', formId }
    });

    if (error) throw error;
    return data;
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

  // ============= PUBLIC METHODS (NO AUTH) =============

  async getPublicForm(formId: string): Promise<CustomForm | null> {
    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: { action: 'GET_PUBLIC_FORM', formId }
    });

    if (error) throw error;
    return data;
  }

  async submitPublicForm(formId: string, submissionData: SubmitFormData): Promise<FormSubmission> {
    const { data, error } = await supabase.functions.invoke('custom-forms-management', {
      body: {
        action: 'SUBMIT_PUBLIC_FORM',
        form_id: formId,
        ...submissionData
      }
    });

    if (error) throw error;
    return data;
  }
}

export const customFormsService = new CustomFormsService();