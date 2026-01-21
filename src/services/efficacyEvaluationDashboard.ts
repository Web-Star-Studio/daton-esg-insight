import { supabase } from "@/integrations/supabase/client";

export interface EfficacyEvaluationItem {
  training_program_id: string;
  training_name: string;
  category: string | null;
  deadline: string;
  status: 'Pendente' | 'Avaliado' | 'Atrasado';
  days_remaining: number;
  evaluation_id?: string;
  branch_name?: string;
  participants_count?: number;
}

export interface EfficacyDashboardMetrics {
  total: number;
  pending: number;
  evaluated: number;
  overdue: number;
}

/**
 * Buscar avaliações de eficácia pendentes para o usuário logado
 */
export const getMyPendingEvaluations = async (): Promise<EfficacyEvaluationItem[]> => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    console.error('User not authenticated');
    return [];
  }

  // Buscar profile para obter company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.company_id) return [];

  // Buscar o employee vinculado ao email do usuário logado
  const userEmail = userData.user.email;
  const { data: linkedEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', userEmail)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  // Se o usuário não está vinculado a nenhum employee, não mostrar avaliações
  if (!linkedEmployee) {
    console.log('User is not linked to any employee record');
    return [];
  }

  // Buscar APENAS treinamentos onde o usuário é o responsável pela avaliação de eficácia
  const { data: trainings, error: trainingsError } = await supabase
    .from('training_programs')
    .select('id, name, category, efficacy_evaluation_deadline, branch_id, efficacy_evaluator_employee_id')
    .eq('company_id', profile.company_id)
    .eq('efficacy_evaluator_employee_id', linkedEmployee.id) // ← Filtrar pelo responsável
    .not('efficacy_evaluation_deadline', 'is', null)
    .order('efficacy_evaluation_deadline', { ascending: true });

  if (trainingsError || !trainings) return [];

  const now = new Date();
  const results: EfficacyEvaluationItem[] = [];

  for (const training of trainings) {
    const { data: evaluation } = await supabase
      .from('training_efficacy_evaluations')
      .select('id, status')
      .eq('training_program_id', training.id)
      .eq('status', 'Concluída')
      .maybeSingle();

    const { count: participantsCount } = await supabase
      .from('employee_trainings')
      .select('*', { count: 'exact', head: true })
      .eq('training_program_id', training.id);

    const deadline = new Date(training.efficacy_evaluation_deadline!);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'Pendente' | 'Avaliado' | 'Atrasado' = 'Pendente';
    if (evaluation) {
      status = 'Avaliado';
    } else if (daysRemaining < 0) {
      status = 'Atrasado';
    }

    results.push({
      training_program_id: training.id,
      training_name: training.name,
      category: training.category,
      deadline: training.efficacy_evaluation_deadline!,
      status,
      days_remaining: daysRemaining,
      evaluation_id: evaluation?.id,
      participants_count: participantsCount || 0,
    });
  }

  return results;
};

export const getEvaluationDashboardMetrics = async (): Promise<EfficacyDashboardMetrics> => {
  const evaluations = await getMyPendingEvaluations();
  return {
    total: evaluations.length,
    pending: evaluations.filter(e => e.status === 'Pendente').length,
    evaluated: evaluations.filter(e => e.status === 'Avaliado').length,
    overdue: evaluations.filter(e => e.status === 'Atrasado').length,
  };
};

export const getEvaluatorByTrainingId = async (trainingProgramId: string) => {
  const { data: training } = await supabase
    .from('training_programs')
    .select('efficacy_evaluator_employee_id')
    .eq('id', trainingProgramId)
    .single();

  if (!training?.efficacy_evaluator_employee_id) return null;

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, email')
    .eq('id', training.efficacy_evaluator_employee_id)
    .single();

  return employee;
};
