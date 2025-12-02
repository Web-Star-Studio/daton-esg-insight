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
  scheduled_date?: string;
  start_date?: string;
  end_date?: string;
  created_by_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  branch_id?: string;
  responsible_id?: string;
  responsible_name?: string;
  // Novos campos para avaliação de eficácia
  efficacy_evaluation_deadline?: string;
  notify_responsible_email?: boolean;
  responsible_email?: string;
  // Campo adicional do join com branches
  branch_name?: string | null;
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
    .select(`
      *,
      branch:branches(id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Mapear para incluir branch_name para facilitar uso
  return (data || []).map(program => ({
    ...program,
    branch_name: (program.branch as any)?.name || null
  }));
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

  // Ensure company and user context
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: companyId, error: companyError } = await supabase.rpc('get_user_company_id');
  if (companyError || !companyId) {
    throw new Error(`Empresa não encontrada para o usuário atual`);
  }

  // Build safe payload (avoid empty strings for UUID columns)
  const payload = {
    name: program.name,
    description: program.description ?? null,
    category: program.category ?? null,
    duration_hours: program.duration_hours ?? null,
    is_mandatory: program.is_mandatory ?? false,
    status: program.status ?? 'Ativo',
    start_date: program.start_date ?? null,
    end_date: program.end_date ?? null,
    branch_id: program.branch_id || null,
    responsible_name: program.responsible_name ?? null,
    efficacy_evaluation_deadline: program.efficacy_evaluation_deadline ?? null,
    notify_responsible_email: program.notify_responsible_email ?? false,
    responsible_email: program.responsible_email ?? null,
    company_id: companyId as string,
    created_by_user_id: userData.user.id as string,
  };
  
  const { data, error } = await supabase
    .from('training_programs')
    .insert([payload])
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

  const { data: companyId, error: companyError } = await supabase.rpc('get_user_company_id');
  if (companyError || !companyId) {
    throw new Error('Empresa não encontrada para o usuário atual');
  }

  const payload = {
    employee_id: training.employee_id,
    training_program_id: training.training_program_id,
    completion_date: training.completion_date ?? null,
    expiration_date: training.expiration_date ?? null,
    score: training.score ?? null,
    status: training.status,
    trainer: training.trainer ?? null,
    notes: training.notes ?? null,
    company_id: companyId as string,
  };
  
  const { data, error } = await supabase
    .from('employee_trainings')
    .insert([payload])
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
    .select('id, full_name, department')
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

  // Enhanced metrics
  const now = new Date();
  
  // Expiring certifications
  const expiringIn30Days = trainings.filter(t => {
    if (t.status !== 'Concluído' || !t.completion_date) return false;
    const program = programs.find(p => p.id === t.training_program_id);
    if (!program?.valid_for_months) return false;
    
    const completionDate = new Date(t.completion_date);
    const expirationDate = new Date(completionDate);
    expirationDate.setMonth(expirationDate.getMonth() + program.valid_for_months);
    
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  }).length;

  const expiringIn60Days = trainings.filter(t => {
    if (t.status !== 'Concluído' || !t.completion_date) return false;
    const program = programs.find(p => p.id === t.training_program_id);
    if (!program?.valid_for_months) return false;
    
    const completionDate = new Date(t.completion_date);
    const expirationDate = new Date(completionDate);
    expirationDate.setMonth(expirationDate.getMonth() + program.valid_for_months);
    
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
  }).length;

  const expiredCount = trainings.filter(t => {
    if (t.status !== 'Concluído' || !t.completion_date) return false;
    const program = programs.find(p => p.id === t.training_program_id);
    if (!program?.valid_for_months) return false;
    
    const completionDate = new Date(t.completion_date);
    const expirationDate = new Date(completionDate);
    expirationDate.setMonth(expirationDate.getMonth() + program.valid_for_months);
    
    return expirationDate < now;
  }).length;

  // Trainings by department
  const trainingsByDepartment = trainings.reduce((acc, training) => {
    const employee = employees.find(e => e.id === training.employee_id);
    const dept = employee?.department || 'Não Especificado';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
    
    const completed = trainings.filter(t => {
      if (!t.completion_date) return false;
      const completionDate = new Date(t.completion_date);
      return completionDate.getMonth() === date.getMonth() && 
             completionDate.getFullYear() === date.getFullYear() &&
             t.status === 'Concluído';
    }).length;

    const enrolled = trainings.filter(t => {
      const createdDate = new Date(t.created_at);
      return createdDate.getMonth() === date.getMonth() && 
             createdDate.getFullYear() === date.getFullYear();
    }).length;

    monthlyTrend.push({ month: monthKey, completed, enrolled });
  }

  // Top performers
  const employeeScores = trainings
    .filter(t => t.score && t.status === 'Concluído')
    .reduce((acc, t) => {
      if (!acc[t.employee_id]) {
        acc[t.employee_id] = { total: 0, count: 0, employee: null };
      }
      acc[t.employee_id].total += t.score!;
      acc[t.employee_id].count += 1;
      acc[t.employee_id].employee = employees.find(e => e.id === t.employee_id);
      return acc;
    }, {} as Record<string, { total: number; count: number; employee: any }>);

  const topPerformers = Object.entries(employeeScores)
    .map(([id, data]) => ({
      employee: data.employee?.full_name || 'N/A',
      avgScore: Number((data.total / data.count).toFixed(1)),
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Department ranking
  const deptScores = trainings
    .filter(t => t.score && t.status === 'Concluído')
    .reduce((acc, t) => {
      const employee = employees.find(e => e.id === t.employee_id);
      const dept = employee?.department || 'Não Especificado';
      if (!acc[dept]) {
        acc[dept] = { totalScore: 0, count: 0, completed: 0, total: 0 };
      }
      acc[dept].totalScore += t.score!;
      acc[dept].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; count: number; completed: number; total: number }>);

  trainings.forEach(t => {
    const employee = employees.find(e => e.id === t.employee_id);
    const dept = employee?.department || 'Não Especificado';
    if (!deptScores[dept]) {
      deptScores[dept] = { totalScore: 0, count: 0, completed: 0, total: 0 };
    }
    deptScores[dept].total += 1;
    if (t.status === 'Concluído') {
      deptScores[dept].completed += 1;
    }
  });

  const departmentRanking = Object.entries(deptScores)
    .map(([dept, data]) => ({
      department: dept,
      avgScore: data.count > 0 ? Number((data.totalScore / data.count).toFixed(1)) : 0,
      completionRate: data.total > 0 ? Number(((data.completed / data.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Compliance rate
  const mandatoryPrograms = programs.filter(p => p.is_mandatory);
  const totalMandatory = employees.length * mandatoryPrograms.length;
  const completedMandatory = mandatoryPrograms.reduce((sum, prog) => {
    return sum + trainings.filter(t => 
      t.training_program_id === prog.id && t.status === 'Concluído'
    ).length;
  }, 0);
  const complianceRate = totalMandatory > 0 ? (completedMandatory / totalMandatory) * 100 : 100;

  // Status distribution
  const statusDistribution = trainings.reduce((acc, training) => {
    acc[training.status] = (acc[training.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTrainings,
    completedTrainings,
    completionRate: totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0,
    averageScore: Number(averageScore.toFixed(1)),
    totalHoursTrained,
    averageHoursPerEmployee: Number(averageHoursPerEmployee.toFixed(1)),
    categoryDistribution,
    expiringIn30Days,
    expiringIn60Days,
    expiredCount,
    complianceRate: Number(complianceRate.toFixed(1)),
    trainingsByDepartment,
    monthlyTrend,
    topPerformers,
    departmentRanking,
    statusDistribution,
  };
};