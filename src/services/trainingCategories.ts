import { supabase } from "@/integrations/supabase/client";

export interface TrainingCategory {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getTrainingCategories(): Promise<TrainingCategory[]> {
  const { data, error } = await supabase
    .from('training_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching training categories:', error);
    throw new Error(`Failed to fetch training categories: ${error.message}`);
  }

  return data || [];
}

export async function createTrainingCategory(name: string, description?: string): Promise<TrainingCategory> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's company_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  const { data, error } = await supabase
    .from('training_categories')
    .insert({
      name: name.trim(),
      description: description?.trim(),
      company_id: profile.company_id,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating training category:', error);
    
    if (error.code === '23505') {
      throw new Error('Já existe uma categoria com este nome');
    }
    
    throw new Error(`Failed to create training category: ${error.message}`);
  }

  return data;
}

export async function deleteTrainingCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('training_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting training category:', error);
    throw new Error(`Failed to delete training category: ${error.message}`);
  }
}
