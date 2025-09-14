import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceFavorite {
  id: string;
  user_id: string;
  company_id: string;
  solution_id: string;
  created_at: string;
}

export const addToFavorites = async (solutionId: string): Promise<MarketplaceFavorite> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('marketplace_favorites')
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      solution_id: solutionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeFromFavorites = async (solutionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('marketplace_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('solution_id', solutionId);

  if (error) throw error;
};

export const getFavorites = async (): Promise<MarketplaceFavorite[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('marketplace_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const isFavorite = async (solutionId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('marketplace_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('solution_id', solutionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

export const getFavoriteIds = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('marketplace_favorites')
    .select('solution_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return data?.map(f => f.solution_id) || [];
};