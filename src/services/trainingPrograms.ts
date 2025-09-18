import { supabase } from "@/integrations/supabase/client";

export interface TrainingProgram {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category?: string;
  duration_hours?: number;
  is_mandatory: boolean;
  valid_for_months?: number;
  created_by_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTraining {
  id: string;
  company_id: string;
  employee_id: string;
  training_program_id: string;
  completion_date?: string;
  expiration_date?: string;
  score?: number;
  status: string;
  trainer?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const getTrainingPrograms = async () => {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const getTrainingProgram = async (id: string) => {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createTrainingProgram = async (program: Omit<TrainingProgram, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('training_programs')
    .insert(program)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrainingProgram = async (id: string, updates: Partial<TrainingProgram>) => {
  const { data, error } = await supabase
    .from('training_programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTrainingProgram = async (id: string) => {
  const { error } = await supabase
    .from('training_programs')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getEmployeeTrainings = async () => {
  const { data, error } = await supabase
    .from('employee_trainings')
    .select(`
      *,
      employee:employee_id(full_name, employee_code, department),
      training_program:training_program_id(name, category, is_mandatory, duration_hours)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createEmployeeTraining = async (training: Omit<EmployeeTraining, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('employee_trainings')
    .insert(training)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEmployeeTraining = async (id: string, updates: Partial<EmployeeTraining>) => {
  const { data, error } = await supabase
    .from('employee_trainings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTrainingMetrics = async () => {
  const { data: trainings, error: trainingsError } = await supabase
    .from('employee_trainings')
    .select('*');

  if (trainingsError) throw trainingsError;

  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('*');

  if (programsError) throw programsError;

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id')
    .eq('status', 'Ativo');

  if (employeesError) throw employeesError;

  const totalTrainings = trainings.length;
  const completedTrainings = trainings.filter(t => t.status === 'Concluído').length;
  const averageScore = trainings
    .filter(t => t.score)
    .reduce((sum, t) => sum + (t.score || 0), 0) / trainings.filter(t => t.score).length || 0;

  const totalHoursTrained = trainings
    .filter(t => t.status === 'Concluído')
    .reduce((sum, t) => {
      const program = programs.find(p => p.id === t.training_program_id);
      return sum + (program?.duration_hours || 0);
    }, 0);

  const averageHoursPerEmployee = employees.length > 0 ? totalHoursTrained / employees.length : 0;

  const categoryDistribution = trainings.reduce((acc, training) => {
    const program = programs.find(p => p.id === training.training_program_id);
    const category = program?.category || 'Outros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTrainings,
    completedTrainings,
    completionRate: totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0,
    averageScore: Number(averageScore.toFixed(1)),
    totalHoursTrained,
    averageHoursPerEmployee: Number(averageHoursPerEmployee.toFixed(1)),
    categoryDistribution
  };
};