import { supabase } from "@/integrations/supabase/client";

export interface SocialProject {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  objective?: string;
  target_audience?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  invested_amount: number;
  status: string;
  impact_metrics: Record<string, any>;
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
}

export const getSocialProjects = async () => {
  const { data, error } = await supabase
    .from('social_projects')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getSocialProject = async (id: string) => {
  const { data, error } = await supabase
    .from('social_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createSocialProject = async (project: Omit<SocialProject, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('social_projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSocialProject = async (id: string, updates: Partial<SocialProject>) => {
  const { data, error } = await supabase
    .from('social_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSocialProject = async (id: string) => {
  const { error } = await supabase
    .from('social_projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getSocialImpactMetrics = async () => {
  const { data: projects, error } = await supabase
    .from('social_projects')
    .select('*');

  if (error) throw error;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Em Andamento').length;
  const completedProjects = projects.filter(p => p.status === 'Concluído').length;
  const totalInvestment = projects.reduce((sum, p) => sum + (p.invested_amount || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const statusDistribution = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const beneficiariesReached = projects.reduce((sum, project) => {
    const metrics = project.impact_metrics as any;
    return sum + (metrics?.beneficiaries_reached || 0);
  }, 0);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalInvestment,
    totalBudget,
    budgetUtilization: totalBudget > 0 ? (totalInvestment / totalBudget) * 100 : 0,
    statusDistribution,
    beneficiariesReached,
    averageInvestmentPerProject: totalProjects > 0 ? totalInvestment / totalProjects : 0
  };
};