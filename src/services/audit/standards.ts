import { supabase } from "@/integrations/supabase/client";

export type CalculationMethod = 'weight_based' | 'quantity_based';
export type FieldType = 'question' | 'guidance' | 'text';

export interface AuditStandard {
  id: string;
  company_id: string;
  code: string;
  name: string;
  name_en?: string;
  name_es?: string;
  version?: string;
  description?: string;
  response_type_id?: string;
  calculation_method: CalculationMethod;
  auto_numbering: boolean;
  allow_partial_response: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StandardItem {
  id: string;
  standard_id: string;
  parent_id?: string;
  item_number: string;
  title: string;
  description?: string;
  field_type: FieldType;
  weight: number;
  is_required: boolean;
  requires_justification: boolean;
  guidance_text?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: StandardItem[];
  depth?: number;
  path?: string[];
}

export interface CreateStandardData {
  code: string;
  name: string;
  name_en?: string;
  name_es?: string;
  version?: string;
  description?: string;
  response_type_id?: string;
  calculation_method?: CalculationMethod;
  auto_numbering?: boolean;
  allow_partial_response?: boolean;
}

export interface CreateStandardItemData {
  standard_id: string;
  parent_id?: string;
  item_number: string;
  title: string;
  description?: string;
  field_type?: FieldType;
  weight?: number;
  is_required?: boolean;
  requires_justification?: boolean;
  guidance_text?: string;
  display_order?: number;
}

class StandardsService {
  async getStandards(): Promise<AuditStandard[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_standards')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;
    return (data || []) as AuditStandard[];
  }

  async getStandardById(id: string): Promise<AuditStandard | null> {
    const { data, error } = await supabase
      .from('audit_standards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditStandard;
  }

  async createStandard(data: CreateStandardData): Promise<AuditStandard> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data: standard, error } = await supabase
      .from('audit_standards')
      .insert([{
        ...data,
        company_id: profile.company_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return standard as AuditStandard;
  }

  async updateStandard(id: string, data: Partial<CreateStandardData>): Promise<AuditStandard> {
    const { data: standard, error } = await supabase
      .from('audit_standards')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return standard as AuditStandard;
  }

  async deleteStandard(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_standards')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // Standard Items
  async getStandardItems(standardId: string): Promise<StandardItem[]> {
    const { data, error } = await supabase
      .from('audit_standard_items')
      .select('*')
      .eq('standard_id', standardId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return this.buildItemsTree(data as StandardItem[]);
  }

  async getStandardItemsFlat(standardId: string): Promise<StandardItem[]> {
    const { data, error } = await supabase
      .from('audit_standard_items')
      .select('*')
      .eq('standard_id', standardId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return (data || []) as StandardItem[];
  }

  private buildItemsTree(items: StandardItem[]): StandardItem[] {
    const itemMap = new Map<string, StandardItem>();
    const rootItems: StandardItem[] = [];

    // First pass: create map and initialize children arrays
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree structure
    items.forEach(item => {
      const currentItem = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        parent.children!.push(currentItem);
      } else {
        rootItems.push(currentItem);
      }
    });

    return rootItems;
  }

  async createStandardItem(data: CreateStandardItemData): Promise<StandardItem> {
    // Get max display_order for siblings
    const { data: siblings } = await supabase
      .from('audit_standard_items')
      .select('display_order')
      .eq('standard_id', data.standard_id)
      .eq('parent_id', data.parent_id || null)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = siblings && siblings.length > 0 ? siblings[0].display_order : -1;

    const { data: item, error } = await supabase
      .from('audit_standard_items')
      .insert([{
        ...data,
        display_order: data.display_order ?? maxOrder + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return item as StandardItem;
  }

  async updateStandardItem(id: string, data: Partial<CreateStandardItemData>): Promise<StandardItem> {
    const { data: item, error } = await supabase
      .from('audit_standard_items')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return item as StandardItem;
  }

  async deleteStandardItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_standard_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async reorderItems(items: { id: string; display_order: number; parent_id?: string }[]): Promise<void> {
    for (const item of items) {
      await supabase
        .from('audit_standard_items')
        .update({ 
          display_order: item.display_order,
          parent_id: item.parent_id || null,
        })
        .eq('id', item.id);
    }
  }

  async duplicateStandard(id: string, newCode: string, newName: string): Promise<AuditStandard> {
    const original = await this.getStandardById(id);
    if (!original) throw new Error('Standard not found');

    const newStandard = await this.createStandard({
      code: newCode,
      name: newName,
      name_en: original.name_en,
      name_es: original.name_es,
      version: original.version,
      description: original.description,
      response_type_id: original.response_type_id,
      calculation_method: original.calculation_method,
      auto_numbering: original.auto_numbering,
      allow_partial_response: original.allow_partial_response,
    });

    // Copy items
    const items = await this.getStandardItemsFlat(id);
    const idMapping = new Map<string, string>();

    // Sort items by depth (parent_id null first)
    const sortedItems = items.sort((a, b) => {
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      return 0;
    });

    for (const item of sortedItems) {
      const newItem = await this.createStandardItem({
        standard_id: newStandard.id,
        parent_id: item.parent_id ? idMapping.get(item.parent_id) : undefined,
        item_number: item.item_number,
        title: item.title,
        description: item.description,
        field_type: item.field_type,
        weight: item.weight,
        is_required: item.is_required,
        requires_justification: item.requires_justification,
        guidance_text: item.guidance_text,
        display_order: item.display_order,
      });
      idMapping.set(item.id, newItem.id);
    }

    return newStandard;
  }
}

export const standardsService = new StandardsService();
