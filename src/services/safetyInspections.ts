import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ChecklistItem {
  id: string;
  item: string;
  category: string;
  status: 'conforme' | 'nao_conforme' | 'na' | 'pendente';
  observation?: string;
}

export interface SafetyInspection {
  id: string;
  company_id: string;
  title: string;
  inspection_type: string;
  area_location?: string;
  inspector_name: string;
  inspector_user_id?: string;
  accompanied_by?: string;
  scheduled_date?: string;
  inspection_date?: string;
  due_date?: string;
  status: string;
  result?: string;
  score?: number;
  checklist_items?: ChecklistItem[];
  observations?: string;
  non_conformities?: string;
  corrective_actions?: string;
  photos_urls?: string[];
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

const parseChecklistItems = (items: Json | null): ChecklistItem[] => {
  if (!items || !Array.isArray(items)) return [];
  return items as unknown as ChecklistItem[];
};

export const getSafetyInspections = async (): Promise<SafetyInspection[]> => {
  const { data, error } = await supabase
    .from('safety_inspections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    checklist_items: parseChecklistItems(item.checklist_items),
  }));
};

export const getSafetyInspection = async (id: string): Promise<SafetyInspection | null> => {
  const { data, error } = await supabase
    .from('safety_inspections')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  return data ? {
    ...data,
    checklist_items: parseChecklistItems(data.checklist_items),
  } : null;
};

export const createSafetyInspection = async (
  inspection: Omit<SafetyInspection, 'id' | 'created_at' | 'updated_at'>
): Promise<SafetyInspection> => {
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user?.id)
    .single();

  const { checklist_items, ...rest } = inspection;

  const { data, error } = await supabase
    .from('safety_inspections')
    .insert({
      ...rest,
      checklist_items: checklist_items as unknown as Json,
      company_id: profile?.company_id!,
      created_by_user_id: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    checklist_items: parseChecklistItems(data.checklist_items),
  };
};

export const updateSafetyInspection = async (
  id: string,
  updates: Partial<SafetyInspection>
): Promise<SafetyInspection> => {
  const { checklist_items, ...rest } = updates;
  
  const updateData: Record<string, unknown> = { ...rest };
  if (checklist_items !== undefined) {
    updateData.checklist_items = checklist_items as unknown as Json;
  }

  const { data, error } = await supabase
    .from('safety_inspections')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    checklist_items: parseChecklistItems(data.checklist_items),
  };
};

export const deleteSafetyInspection = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('safety_inspections')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export interface SafetyInspectionMetrics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  conformeRate: number;
  thisMonth: number;
  lastMonth: number;
}

export const getSafetyInspectionMetrics = async (): Promise<SafetyInspectionMetrics> => {
  const { data, error } = await supabase
    .from('safety_inspections')
    .select('*');

  if (error) throw error;

  const inspections = data || [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const completed = inspections.filter(i => i.status === 'Concluída');
  const conforme = completed.filter(i => i.result === 'Conforme');

  return {
    total: inspections.length,
    pending: inspections.filter(i => i.status === 'Pendente').length,
    inProgress: inspections.filter(i => i.status === 'Em Andamento').length,
    completed: completed.length,
    conformeRate: completed.length > 0 ? (conforme.length / completed.length) * 100 : 0,
    thisMonth: inspections.filter(i => {
      const date = new Date(i.inspection_date || i.created_at);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length,
    lastMonth: inspections.filter(i => {
      const date = new Date(i.inspection_date || i.created_at);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length,
  };
};
