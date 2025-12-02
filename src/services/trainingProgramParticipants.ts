import { supabase } from "@/integrations/supabase/client";

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

  // Get employees data
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name, employee_code, department')
    .in('id', employeeIds);

  if (employeeError) throw employeeError;

  // Map trainings with employee data
  return trainings.map(training => {
    const employee = employees?.find(emp => emp.id === training.employee_id);
    return {
      id: training.id,
      employee_id: training.employee_id,
      employee_name: employee?.full_name || 'N/A',
      employee_code: employee?.employee_code || 'N/A',
      department: employee?.department || 'N/A',
      status: training.status,
      completion_date: training.completion_date,
      expiration_date: training.expiration_date,
      score: training.score,
      trainer: training.trainer,
      notes: training.notes,
      created_at: training.created_at,
    };
  });
};

export const getTrainingProgramStats = async (programId: string): Promise<TrainingProgramStats> => {
  const { data: trainings, error } = await supabase
    .from('employee_trainings')
    .select('status, score')
    .eq('training_program_id', programId);

  if (error) throw error;

  const total = trainings?.length || 0;
  const completed = trainings?.filter(t => t.status === 'Concluído').length || 0;
  const inProgress = trainings?.filter(t => t.status === 'Em Andamento').length || 0;
  const enrolled = trainings?.filter(t => t.status === 'Inscrito').length || 0;
  const cancelled = trainings?.filter(t => t.status === 'Cancelado').length || 0;
  const failed = trainings?.filter(t => t.status === 'Reprovado').length || 0;

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
  };
};
