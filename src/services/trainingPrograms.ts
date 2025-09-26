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
  console.log('Creating training program:', program);
  
  const { data, error } = await supabase
    .from('training_programs')
    .insert([program])
    .select()
    .single();

  if (error) {
    console.error('Error creating training program:', error);
    throw new Error(`Erro ao criar programa de treinamento: ${error.message}`);
  }

  console.log('Training program created successfully:', data);
  return data;
};

export const updateTrainingProgram = async (id: string, updates: Partial<TrainingProgram>) => {
  console.log('Updating training program:', id, updates);
  
  const { data, error } = await supabase
    .from('training_programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating training program:', error);
    throw new Error(`Erro ao atualizar programa de treinamento: ${error.message}`);
  }

  console.log('Training program updated successfully:', data);
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
  // Get employee trainings first
  const { data: trainings, error: trainingError } = await supabase
    .from('employee_trainings')
    .select('*')
    .order('created_at', { ascending: false });

  if (trainingError) throw trainingError;
  if (!trainings) return [];

  // Get employees data
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name, employee_code, department');

  if (employeeError) throw employeeError;

  // Get training programs data
  const { data: programs, error: programError } = await supabase
    .from('training_programs')
    .select('id, name, category, is_mandatory, duration_hours');

  if (programError) throw programError;

  // Manually join the data and ensure safe property access
  return trainings.map(training => {
    const employee = employees?.find(emp => emp.id === training.employee_id);
    const program = programs?.find(prog => prog.id === training.training_program_id);
    
    return {
      ...training,
      employee: employee ? {
        id: employee.id,
        full_name: employee.full_name,
        employee_code: employee.employee_code,
        department: employee.department
      } : null,
      training_program: program ? {
        id: program.id,
        name: program.name,
        category: program.category,
        is_mandatory: program.is_mandatory,
        duration_hours: program.duration_hours
      } : null
    };
  });
};

export const createEmployeeTraining = async (training: Omit<EmployeeTraining, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('Creating employee training:', training);
  
  const { data, error } = await supabase
    .from('employee_trainings')
    .insert([training])
    .select()
    .single();

  if (error) {
    console.error('Error creating employee training:', error);
    throw new Error(`Erro ao criar treinamento do funcionário: ${error.message}`);
  }

  console.log('Employee training created successfully:', data);
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