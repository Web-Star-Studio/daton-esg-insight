import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];
type ProgressUpdate = Database['public']['Tables']['goal_progress_updates']['Row'];
type ProgressUpdateInsert = Database['public']['Tables']['goal_progress_updates']['Insert'];

export interface GoalListItem {
  id: string;
  name: string;
  metric_key: string;
  target_value: number;
  deadline_date: string;
  current_progress_percent: number;
  status: "No Caminho Certo" | "Atenção Necessária" | "Atingida" | "Atrasada";
}

export interface GoalDetail extends GoalListItem {
  description?: string;
  baseline_value?: number;
  baseline_period?: string;
  responsible_user_id?: string;
  progress_history: {
    update_date: string;
    current_value: number;
    progress_percent: number;
    notes?: string;
  }[];
}

export interface CreateGoalData {
  name: string;
  description?: string;
  metric_key: string;
  baseline_value?: number;
  baseline_period?: string;
  target_value: number;
  deadline_date: string;
  responsible_user_id?: string;
}

export interface ProgressUpdateData {
  update_date: string;
  current_value: number;
  notes?: string;
}

// Get current progress percentage for a goal
const getCurrentProgress = async (goalId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('goal_progress_updates')
    .select('progress_percentage')
    .eq('goal_id', goalId)
    .order('update_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching progress:', error);
    return 0;
  }
  return data?.progress_percentage || 0;
};

// Determine goal status based on progress and deadline
const calculateGoalStatus = (progress: number, deadline: string): GoalListItem['status'] => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const daysToDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (progress >= 100) return "Atingida";
  if (deadlineDate < today) return "Atrasada";
  if (progress < 50 && daysToDeadline < 90) return "Atenção Necessária";
  return "No Caminho Certo";
};

// GET /api/v1/goals - List all goals with current progress
export const getGoals = async (): Promise<GoalListItem[]> => {
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }

  // Get current progress for each goal
  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const progress = await getCurrentProgress(goal.id);
      const status = calculateGoalStatus(progress, goal.deadline_date);

      return {
        id: goal.id,
        name: goal.name,
        metric_key: goal.metric_key,
        target_value: goal.target_value,
        deadline_date: goal.deadline_date,
        current_progress_percent: progress,
        status,
      };
    })
  );

  return goalsWithProgress;
};

// POST /api/v1/goals - Create new goal
export const createGoal = async (goalData: CreateGoalData): Promise<Goal> => {
  console.log('Creating goal with data:', goalData);
  
  // Get user's company_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    console.error('Error fetching user company:', profileError);
    throw new Error('Não foi possível identificar a empresa do usuário');
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      name: goalData.name,
      description: goalData.description,
      metric_key: goalData.metric_key,
      baseline_value: goalData.baseline_value,
      baseline_period: goalData.baseline_period,
      target_value: goalData.target_value,
      deadline_date: goalData.deadline_date,
      responsible_user_id: goalData.responsible_user_id,
      company_id: profile.company_id,
      status: 'No Caminho Certo',
    } as GoalInsert)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating goal:', error);
    throw new Error(`Erro ao salvar meta: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar meta');
  }

  console.log('Goal created successfully:', data);
  return data;
};

// GET /api/v1/goals/{goalId} - Get goal details with progress history
export const getGoalById = async (id: string): Promise<GoalDetail> => {
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (goalError || !goal) {
    console.error('Error fetching goal:', goalError);
    throw new Error('Meta não encontrada');
  }

  // Get progress history
  const { data: progressHistory, error: progressError } = await supabase
    .from('goal_progress_updates')
    .select('update_date, current_value, progress_percentage, notes')
    .eq('goal_id', id)
    .order('update_date', { ascending: true });

  if (progressError) {
    console.error('Error fetching progress history:', progressError);
    throw progressError;
  }

  const currentProgress = progressHistory?.length > 0 
    ? progressHistory[progressHistory.length - 1].progress_percentage || 0 
    : 0;
  
  const status = calculateGoalStatus(currentProgress, goal.deadline_date);

  return {
    id: goal.id,
    name: goal.name,
    metric_key: goal.metric_key,
    target_value: goal.target_value,
    deadline_date: goal.deadline_date,
    current_progress_percent: currentProgress,
    status,
    description: goal.description,
    baseline_value: goal.baseline_value,
    baseline_period: goal.baseline_period,
    responsible_user_id: goal.responsible_user_id,
    progress_history: progressHistory?.map(update => ({
      update_date: update.update_date,
      current_value: update.current_value,
      progress_percent: update.progress_percentage || 0,
      notes: update.notes,
    })) || [],
  };
};

// POST /api/v1/goals/{goalId}/progress-updates - Add progress update
export const addProgressUpdate = async (goalId: string, updateData: ProgressUpdateData): Promise<void> => {
  const { error } = await supabase
    .from('goal_progress_updates')
    .insert({
      goal_id: goalId,
      update_date: updateData.update_date,
      current_value: updateData.current_value,
      notes: updateData.notes,
    } as ProgressUpdateInsert);

  if (error) {
    console.error('Error adding progress update:', error);
    throw error;
  }
};

// Get users from company for responsible assignment
export const getCompanyUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, job_title')
    .order('full_name');

  if (error) {
    console.error('Error fetching company users:', error);
    throw error;
  }

  return data;
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const goals = await getGoals();
  
  const activeGoals = goals.filter(goal => goal.status !== "Atingida").length;
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + goal.current_progress_percent, 0) / goals.length)
    : 0;
  const delayedGoals = goals.filter(goal => goal.status === "Atrasada").length;

  return {
    activeGoals,
    averageProgress,
    delayedGoals,
  };
};