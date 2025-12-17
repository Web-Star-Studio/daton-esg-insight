import { supabase } from "@/integrations/supabase/client";

export interface AuditTemplate {
  id: string;
  category_id?: string;
  company_id: string;
  name: string;
  description?: string;
  default_audit_type: string;
  estimated_duration_hours?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    title: string;
    color_hex: string;
  };
  standards?: TemplateStandard[];
  plannings?: TemplatePlanning[];
}

export interface TemplateStandard {
  id: string;
  template_id: string;
  standard_id: string;
  display_order: number;
  standard?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface TemplatePlanning {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  suggested_duration_minutes?: number;
  display_order: number;
  items?: TemplatePlanningItem[];
}

export interface TemplatePlanningItem {
  id: string;
  template_planning_id: string;
  standard_item_id: string;
  display_order: number;
}

export interface CreateTemplateData {
  category_id?: string;
  name: string;
  description?: string;
  default_audit_type?: string;
  estimated_duration_hours?: number;
}

export interface CreateTemplatePlanningData {
  template_id: string;
  name: string;
  description?: string;
  suggested_duration_minutes?: number;
  display_order?: number;
}

class TemplatesService {
  async getTemplates(): Promise<AuditTemplate[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_templates')
      .select(`
        *,
        category:audit_categories(id, title, color_hex)
      `)
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as AuditTemplate[];
  }

  async getTemplateById(id: string): Promise<AuditTemplate | null> {
    const { data, error } = await supabase
      .from('audit_templates')
      .select(`
        *,
        category:audit_categories(id, title, color_hex)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditTemplate;
  }

  async getTemplateWithDetails(id: string): Promise<AuditTemplate | null> {
    const template = await this.getTemplateById(id);
    if (!template) return null;

    // Get standards
    const { data: standards } = await supabase
      .from('audit_template_standards')
      .select(`
        *,
        standard:audit_standards(id, code, name)
      `)
      .eq('template_id', id)
      .order('display_order');

    // Get plannings
    const { data: plannings } = await supabase
      .from('audit_template_plannings')
      .select('*')
      .eq('template_id', id)
      .order('display_order');

    return {
      ...template,
      standards: (standards || []) as TemplateStandard[],
      plannings: (plannings || []) as TemplatePlanning[],
    };
  }

  async createTemplate(data: CreateTemplateData): Promise<AuditTemplate> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data: template, error } = await supabase
      .from('audit_templates')
      .insert([{
        ...data,
        company_id: profile.company_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return template as AuditTemplate;
  }

  async updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<AuditTemplate> {
    const { data: template, error } = await supabase
      .from('audit_templates')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return template as AuditTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // Template Standards
  async addStandardToTemplate(templateId: string, standardId: string): Promise<TemplateStandard> {
    const { data: existing } = await supabase
      .from('audit_template_standards')
      .select('display_order')
      .eq('template_id', templateId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].display_order : -1;

    const { data, error } = await supabase
      .from('audit_template_standards')
      .insert([{
        template_id: templateId,
        standard_id: standardId,
        display_order: maxOrder + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as TemplateStandard;
  }

  async removeStandardFromTemplate(templateId: string, standardId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_template_standards')
      .delete()
      .eq('template_id', templateId)
      .eq('standard_id', standardId);

    if (error) throw error;
  }

  async getTemplateStandards(templateId: string): Promise<TemplateStandard[]> {
    const { data, error } = await supabase
      .from('audit_template_standards')
      .select(`
        *,
        standard:audit_standards(id, code, name)
      `)
      .eq('template_id', templateId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as TemplateStandard[];
  }

  // Template Plannings
  async createPlanning(data: CreateTemplatePlanningData): Promise<TemplatePlanning> {
    const { data: existing } = await supabase
      .from('audit_template_plannings')
      .select('display_order')
      .eq('template_id', data.template_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].display_order : -1;

    const { data: planning, error } = await supabase
      .from('audit_template_plannings')
      .insert([{
        ...data,
        display_order: data.display_order ?? maxOrder + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return planning as TemplatePlanning;
  }

  async updatePlanning(id: string, data: Partial<CreateTemplatePlanningData>): Promise<TemplatePlanning> {
    const { data: planning, error } = await supabase
      .from('audit_template_plannings')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return planning as TemplatePlanning;
  }

  async deletePlanning(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_template_plannings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTemplatePlannings(templateId: string): Promise<TemplatePlanning[]> {
    const { data, error } = await supabase
      .from('audit_template_plannings')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as TemplatePlanning[];
  }

  // Planning Items
  async addItemToPlanning(planningId: string, standardItemId: string): Promise<TemplatePlanningItem> {
    const { data: existing } = await supabase
      .from('audit_template_planning_items')
      .select('display_order')
      .eq('template_planning_id', planningId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].display_order : -1;

    const { data, error } = await supabase
      .from('audit_template_planning_items')
      .insert([{
        template_planning_id: planningId,
        standard_item_id: standardItemId,
        display_order: maxOrder + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as TemplatePlanningItem;
  }

  async removeItemFromPlanning(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_template_planning_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  async getPlanningItems(planningId: string): Promise<TemplatePlanningItem[]> {
    const { data, error } = await supabase
      .from('audit_template_planning_items')
      .select('*')
      .eq('template_planning_id', planningId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as TemplatePlanningItem[];
  }
}

export const templatesService = new TemplatesService();
