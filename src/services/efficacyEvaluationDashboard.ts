import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { isDemoRuntimeEnabled, resolveDemoData } from "./demoResolver";

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
  // Quantos participantes do programa já têm evaluation com status='Concluída'.
  // Programa só vira 'Avaliado' quando evaluated_count == participants_count.
  evaluated_count?: number;
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
  if (isDemoRuntimeEnabled()) {
    const evaluations = resolveDemoData<EfficacyEvaluationItem[]>(['my-efficacy-evaluations']);
    return Array.isArray(evaluations) ? evaluations : [];
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    logger.warn('User not authenticated', 'training');
    return [];
  }

  // Buscar profile para obter company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.company_id) return [];

  // Buscar o employee vinculado ao email do usuário logado.
  // Match case-insensitive: muitos employees vieram de import/clone com email
  // em CAPS (ex.: GESTORARH@TRANSGABARDO.COM.BR), enquanto auth.users guarda
  // lowercase. Sem o ilike, esses responsáveis não viam suas pendências.
  const userEmail = userData.user.email;
  const { data: linkedEmployee } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', userEmail!)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  // Se o usuário não está vinculado a nenhum employee, não mostrar avaliações
  if (!linkedEmployee) {
    logger.debug('User is not linked to any employee record', 'training');
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

  if (trainingsError || !trainings || trainings.length === 0) return [];

  // Batch fetch evaluations + participant counts pra todos os trainings de uma vez.
  // Antes era um loop de 2 queries por training (N×2 sequencial), o que com 179
  // trainings clonados da Gabardo gerava ~720 queries serializadas e a página
  // ficava travada carregando por dezenas de segundos.
  const trainingIds = trainings.map(t => t.id);

  const [evalsResp, partsResp] = await Promise.all([
    supabase
      .from('training_efficacy_evaluations')
      .select('id, training_program_id, employee_training_id, status')
      .in('training_program_id', trainingIds)
      .eq('status', 'Concluída'),
    supabase
      .from('employee_trainings')
      .select('id, training_program_id')
      .in('training_program_id', trainingIds),
  ]);

  // Conta participants únicos (employee_training_id) por programa.
  const participantsByTraining = new Map<string, Set<string>>();
  for (const row of partsResp.data || []) {
    const set = participantsByTraining.get(row.training_program_id) || new Set<string>();
    set.add(row.id);
    participantsByTraining.set(row.training_program_id, set);
  }

  // Conta evaluations concluídas por programa, contabilizando participants
  // distintos (employee_training_id). Avaliações antigas sem
  // employee_training_id (formato legado por programa) contam como 1.
  const evaluatedByTraining = new Map<string, Set<string>>();
  for (const ev of evalsResp.data || []) {
    const set = evaluatedByTraining.get(ev.training_program_id) || new Set<string>();
    set.add(ev.employee_training_id || `__program__:${ev.id}`);
    evaluatedByTraining.set(ev.training_program_id, set);
  }

  const now = new Date();
  return trainings.map(training => {
    const participants = participantsByTraining.get(training.id);
    const evaluated = evaluatedByTraining.get(training.id);
    const participantsCount = participants?.size ?? 0;
    const evaluatedCount = evaluated?.size ?? 0;
    const deadline = new Date(training.efficacy_evaluation_deadline!);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    // Programa só sai de 'Pendente' quando TODOS os participantes têm evaluation
    // concluída (granularidade por colaborador). Edge case: programa sem
    // participantes nunca vira 'Avaliado' — mantém 'Pendente' (ou 'Atrasado').
    const allEvaluated = participantsCount > 0 && evaluatedCount >= participantsCount;
    let status: 'Pendente' | 'Avaliado' | 'Atrasado' = 'Pendente';
    if (allEvaluated) status = 'Avaliado';
    else if (daysRemaining < 0) status = 'Atrasado';
    return {
      training_program_id: training.id,
      training_name: training.name,
      category: training.category,
      deadline: training.efficacy_evaluation_deadline!,
      status,
      days_remaining: daysRemaining,
      participants_count: participantsCount,
      evaluated_count: evaluatedCount,
    };
  });
};

export const getEvaluationDashboardMetrics = async (): Promise<EfficacyDashboardMetrics> => {
  if (isDemoRuntimeEnabled()) {
    const metrics = resolveDemoData<EfficacyDashboardMetrics>(['efficacy-dashboard-metrics']);
    return {
      total: metrics?.total || 0,
      pending: metrics?.pending || 0,
      evaluated: metrics?.evaluated || 0,
      overdue: metrics?.overdue || 0,
    };
  }

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
