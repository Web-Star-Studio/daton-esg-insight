import { supabase } from "@/integrations/supabase/client";

export interface AuditCategory {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  icon: string;
  color_hex: string;
  display_order: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  title: string;
  description?: string;
  icon?: string;
  color_hex?: string;
  display_order?: number;
}

class CategoriesService {
  async getCategories(): Promise<AuditCategory[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('audit_categories')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return (data || []) as AuditCategory[];
  }

  async getCategoryById(id: string): Promise<AuditCategory | null> {
    const { data, error } = await supabase
      .from('audit_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AuditCategory;
  }

  async createCategory(data: CreateCategoryData): Promise<AuditCategory> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Get max display_order
    const { data: existing } = await supabase
      .from('audit_categories')
      .select('display_order')
      .eq('company_id', profile.company_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].display_order : -1;

    const { data: category, error } = await supabase
      .from('audit_categories')
      .insert([{
        ...data,
        company_id: profile.company_id,
        display_order: data.display_order ?? maxOrder + 1,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return category as AuditCategory;
  }

  async updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<AuditCategory> {
    const { data: category, error } = await supabase
      .from('audit_categories')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return category as AuditCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('audit_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async reorderCategories(categories: { id: string; display_order: number }[]): Promise<void> {
    for (const cat of categories) {
      await supabase
        .from('audit_categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id);
    }
  }
}

export const categoriesService = new CategoriesService();
