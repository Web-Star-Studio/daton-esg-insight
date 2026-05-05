import { supabase } from "@/integrations/supabase/client";
import { calculateTrainingStatus } from "@/utils/trainingStatusCalculator";

// Derivamos o status exibido a partir das datas do programa para evitar que o
// participante fique "preso" em "Inscrito" depois do término. Status manuais
// como "Cancelado" e "Reprovado" são preservados.
const PRESERVE_STATUSES = new Set(["Cancelado", "Reprovado"]);

export interface TrainingParticipant {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department: string;
  status: string;
  completion_date: string | null;
  expiration_date: string | null;
  score: number | null;
  trainer: string | null;
  notes: string | null;
  created_at: string;
  attended: boolean | null;
  attendance_marked_at: string | null;
}

export interface TrainingProgramStats {
  total: number;
  completed: number;
  inProgress: number;
  enrolled: number;
  cancelled: number;
  failed: number;
  completionRate: number;
  averageScore: number;
  present: number;
  absent: number;
  notMarked: number;
}

export const getTrainingProgramParticipants = async (programId: string): Promise<TrainingParticipant[]> => {
  // Get employee trainings for this program
  const { data: trainings, error: trainingError } = await supabase
    .from('employee_trainings')
    .select('*')
    .eq('training_program_id', programId)
    .order('created_at', { ascending: false });

  if (trainingError) throw trainingError;
  if (!trainings) return [];

  // Get employee IDs
  const employeeIds = [...new Set(trainings.map(t => t.employee_id))];

  if (employeeIds.length === 0) return [];

  // Fetch program dates and any concluded efficacy evaluations to derive the
  // displayed status (avoids leaving participants stuck on "Inscrito" after
  // the training end date).
  const [{ data: program }, { data: evaluations }, { data: employees, error: employeeError }] =
    await Promise.all([
      supabase
        .from('training_programs')
        .select('start_date, end_date, efficacy_evaluation_deadline')
        .eq('id', programId)
        .maybeSingle(),
      supabase
        .from('training_efficacy_evaluations')
        .select('employee_training_id')
        .eq('training_program_id', programId)
        .eq('status', 'Concluída'),
      supabase
        .from('employees')
        .select('id, full_name, employee_code, department')
        .in('id', employeeIds),
    ]);

  if (employeeError) throw employeeError;

  const evaluatedSet = new Set(
    (evaluations || [])
      .map((e: { employee_training_id: string | null }) => e.employee_training_id)
      .filter((id): id is string => !!id),
  );

  // Map trainings with employee data
  return trainings.map(training => {
    const employee = employees?.find(emp => emp.id === training.employee_id);
    const derivedStatus = program
      ? calculateTrainingStatus({
          start_date: program.start_date,
          end_date: program.end_date,
          efficacy_evaluation_deadline: program.efficacy_evaluation_deadline,
          hasEfficacyEvaluation: evaluatedSet.has(training.id),
        })
      : null;
    const status = PRESERVE_STATUSES.has(training.status)
      ? training.status
      : derivedStatus || training.status;
    return {
      id: training.id,
      employee_id: training.employee_id,
      employee_name: employee?.full_name || 'N/A',
      employee_code: employee?.employee_code || 'N/A',
      department: employee?.department || 'N/A',
      status,
      completion_date: training.completion_date,
      expiration_date: training.expiration_date,
      score: training.score,
      trainer: training.trainer,
      notes: training.notes,
      created_at: training.created_at,
      attended: (training as any).attended ?? null,
      attendance_marked_at: (training as any).attendance_marked_at ?? null,
    };
  });
};

export const getTrainingProgramStats = async (programId: string): Promise<TrainingProgramStats> => {
  const [{ data: trainings, error }, { data: program }, { data: evaluations }] =
    await Promise.all([
      supabase
        .from('employee_trainings')
        .select('id, status, score, attended')
        .eq('training_program_id', programId),
      supabase
        .from('training_programs')
        .select('start_date, end_date, efficacy_evaluation_deadline')
        .eq('id', programId)
        .maybeSingle(),
      supabase
        .from('training_efficacy_evaluations')
        .select('employee_training_id')
        .eq('training_program_id', programId)
        .eq('status', 'Concluída'),
    ]);

  if (error) throw error;

  const evaluatedSet = new Set(
    (evaluations || [])
      .map((e: { employee_training_id: string | null }) => e.employee_training_id)
      .filter((id): id is string => !!id),
  );

  const derivedStatuses = (trainings || []).map((t: any) => {
    if (PRESERVE_STATUSES.has(t.status)) return t.status as string;
    if (!program) return t.status as string;
    return calculateTrainingStatus({
      start_date: program.start_date,
      end_date: program.end_date,
      efficacy_evaluation_deadline: program.efficacy_evaluation_deadline,
      hasEfficacyEvaluation: evaluatedSet.has(t.id),
    }) as string;
  });

  const total = trainings?.length || 0;
  const completed = derivedStatuses.filter(s => s === 'Concluído' || s === 'Pendente Avaliação').length;
  const inProgress = derivedStatuses.filter(s => s === 'Em Andamento').length;
  const enrolled = derivedStatuses.filter(s => s === 'Inscrito' || s === 'Planejado').length;
  const cancelled = derivedStatuses.filter(s => s === 'Cancelado').length;
  const failed = derivedStatuses.filter(s => s === 'Reprovado').length;

  // Attendance stats
  const present = trainings?.filter(t => (t as any).attended === true).length || 0;
  const absent = trainings?.filter(t => (t as any).attended === false).length || 0;
  const notMarked = trainings?.filter(t => (t as any).attended === null || (t as any).attended === undefined).length || 0;

  const scores = trainings?.filter(t => t.score !== null).map(t => t.score!) || [];
  const averageScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    inProgress,
    enrolled,
    cancelled,
    failed,
    completionRate: Number(completionRate.toFixed(1)),
    averageScore: Number(averageScore.toFixed(1)),
    present,
    absent,
    notMarked,
  };
};

export const markAttendance = async (
  participantId: string, 
  attended: boolean | null,
  userId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('employee_trainings')
    .update({ 
      attended,
      attendance_marked_at: attended !== null ? new Date().toISOString() : null,
      attendance_marked_by: userId || null
    } as any)
    .eq('id', participantId);

  if (error) throw error;
};

export const markAllAttendance = async (
  participantIds: string[], 
  attended: boolean | null,
  userId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('employee_trainings')
    .update({ 
      attended,
      attendance_marked_at: attended !== null ? new Date().toISOString() : null,
      attendance_marked_by: userId || null
    } as any)
    .in('id', participantIds);

  if (error) throw error;
};
