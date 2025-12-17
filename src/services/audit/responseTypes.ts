import { supabase } from "@/integrations/supabase/client";

export interface ResponseOption {
  id: string;
  response_type_id: string;
  label: string;
  label_en?: string;
  label_es?: string;
  adherence_value: number;
  is_not_counted: boolean;
  triggers_occurrence: boolean;
  color_hex: string;
  icon?: string;
  display_order: number;
  created_at: string;
}

export interface ResponseType {
  id: string;
  company_id: string;
  name: string;
  name_en?: string;
  name_es?: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  options?: ResponseOption[];
}

export interface CreateResponseTypeData {
  name: string;
  name_en?: string;
  name_es?: string;
  description?: string;
  options?: Omit<ResponseOption, 'id' | 'response_type_id' | 'created_at'>[];
}

export interface CreateResponseOptionData {
  response_type_id: string;
  label: string;
  label_en?: string;
  label_es?: string;
  adherence_value?: number;
  is_not_counted?: boolean;
  triggers_occurrence?: boolean;
  color_hex?: string;
  icon?: string;
  display_order?: number;
}

class ResponseTypesService {
  async getResponseTypes(): Promise<ResponseType[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_response_types')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as ResponseType[];
  }

  async getResponseTypeWithOptions(id: string): Promise<ResponseType | null> {
    const { data: responseType, error: typeError } = await supabase
      .from('audit_response_types')
      .select('*')
      .eq('id', id)
      .single();

    if (typeError) throw typeError;
    if (!responseType) return null;

    const { data: options, error: optionsError } = await supabase
      .from('audit_response_options')
      .select('*')
      .eq('response_type_id', id)
      .order('display_order');

    if (optionsError) throw optionsError;

    return {
      ...responseType,
      options: options || [],
    } as ResponseType;
  }

  async createResponseType(data: CreateResponseTypeData): Promise<ResponseType> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { options, ...typeData } = data;

    const { data: responseType, error } = await supabase
      .from('audit_response_types')
      .insert([{
        ...typeData,
        company_id: profile.company_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;

    // Create options if provided
    if (options && options.length > 0) {
      const optionsWithTypeId = options.map((opt, index) => ({
        ...opt,
        response_type_id: responseType.id,
        display_order: opt.display_order ?? index,
      }));

      const { error: optionsError } = await supabase
        .from('audit_response_options')
        .insert(optionsWithTypeId);

      if (optionsError) throw optionsError;
    }

    return responseType as ResponseType;
  }

  async updateResponseType(id: string, data: Partial<CreateResponseTypeData>): Promise<ResponseType> {
    const { options, ...typeData } = data;

    const { data: responseType, error } = await supabase
      .from('audit_response_types')
      .update({
        ...typeData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return responseType as ResponseType;
  }

  async deleteResponseType(id: string): Promise<void> {
    // Check if response type is linked to any standard
    const { data: linkedStandards } = await supabase
      .from('audit_standards')
      .select('id')
      .eq('response_type_id', id)
      .limit(1);

    if (linkedStandards && linkedStandards.length > 0) {
      throw new Error('Este tipo de resposta está vinculado a normas e não pode ser excluído');
    }

    const { error } = await supabase
      .from('audit_response_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Response Options
  async getResponseOptions(responseTypeId: string): Promise<ResponseOption[]> {
    const { data, error } = await supabase
      .from('audit_response_options')
      .select('*')
      .eq('response_type_id', responseTypeId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as ResponseOption[];
  }

  async createResponseOption(data: CreateResponseOptionData): Promise<ResponseOption> {
    const { data: option, error } = await supabase
      .from('audit_response_options')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return option as ResponseOption;
  }

  async updateResponseOption(id: string, data: Partial<CreateResponseOptionData>): Promise<ResponseOption> {
    const { data: option, error } = await supabase
      .from('audit_response_options')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return option as ResponseOption;
  }

  async deleteResponseOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_response_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async reorderOptions(options: { id: string; display_order: number }[]): Promise<void> {
    for (const opt of options) {
      await supabase
        .from('audit_response_options')
        .update({ display_order: opt.display_order })
        .eq('id', opt.id);
    }
  }
}

export const responseTypesService = new ResponseTypesService();
