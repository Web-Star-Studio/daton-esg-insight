import { supabase } from "@/integrations/supabase/client";

export interface SafetyTrainingMetric {
  programId: string;
  programName: string;
  category: string;
  totalEnrolled: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  expired: number;
  durationHours: number;
}

export interface SafetyTrainingMetricsResult {
  programs: SafetyTrainingMetric[];
  overallCompliance: number;
  totalHours: number;
  totalEmployeesTrained: number;
  pendingTrainings: number;
  expiredTrainings: number;
}

const SAFETY_CATEGORIES = ['Segurança', 'EPI', 'SST', 'NR'];
const SAFETY_KEYWORDS = ['NR-', 'Segurança', 'EPI', 'Socorro', 'CIPA', 'Brigada', 'Incêndio', 'APR', 'SST'];

const isSafetyTraining = (programName: string, category: string): boolean => {
  const lowerName = programName.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  if (SAFETY_CATEGORIES.some(cat => lowerCategory.includes(cat.toLowerCase()))) {
    return true;
  }
  
  if (SAFETY_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
    return true;
  }
  
  return false;
};

export const getSafetyTrainingMetrics = async (companyId: string): Promise<SafetyTrainingMetricsResult> => {
  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('id, name, category, duration_hours, status')
    .eq('company_id', companyId);

  if (programsError) throw programsError;

  const safetyPrograms = (programs || []).filter(p => 
    isSafetyTraining(p.name, p.category || '')
  );

  if (safetyPrograms.length === 0) {
    return {
      programs: [],
      overallCompliance: 0,
      totalHours: 0,
      totalEmployeesTrained: 0,
      pendingTrainings: 0,
      expiredTrainings: 0,
    };
  }

  const safetyProgramIds = safetyPrograms.map(p => p.id);

  const { data: trainings, error: trainingsError } = await supabase
    .from('employee_trainings')
    .select('id, training_program_id, status, completion_date, expiration_date, employee_id')
    .in('training_program_id', safetyProgramIds);

  if (trainingsError) throw trainingsError;

  const now = new Date();

  const programMetrics: SafetyTrainingMetric[] = safetyPrograms.map(program => {
    const programTrainings = (trainings || []).filter(t => t.training_program_id === program.id);
    
    const totalEnrolled = programTrainings.length;
    const completed = programTrainings.filter(t => t.status === 'Concluído').length;
    const inProgress = programTrainings.filter(t => t.status === 'Em Andamento').length;
    const pending = programTrainings.filter(t => t.status === 'Inscrito' || t.status === 'Pendente').length;
    
    const expired = programTrainings.filter(t => {
      if (t.expiration_date) {
        return new Date(t.expiration_date) < now;
      }
      return false;
    }).length;

    const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

    return {
      programId: program.id,
      programName: program.name,
      category: program.category || 'Segurança',
      totalEnrolled,
      completed,
      inProgress,
      pending,
      completionRate,
      expired,
      durationHours: program.duration_hours || 0,
    };
  });

  const totalEnrolled = programMetrics.reduce((sum, p) => sum + p.totalEnrolled, 0);
  const totalCompleted = programMetrics.reduce((sum, p) => sum + p.completed, 0);
  const overallCompliance = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  const totalHours = programMetrics.reduce((sum, p) => sum + (p.durationHours * p.completed), 0);

  const uniqueEmployees = new Set(
    (trainings || [])
      .filter(t => t.status === 'Concluído')
      .map(t => t.employee_id)
  );

  const pendingTrainings = programMetrics.reduce((sum, p) => sum + p.pending + p.inProgress, 0);
  const expiredTrainings = programMetrics.reduce((sum, p) => sum + p.expired, 0);

  return {
    programs: programMetrics.sort((a, b) => b.totalEnrolled - a.totalEnrolled),
    overallCompliance,
    totalHours,
    totalEmployeesTrained: uniqueEmployees.size,
    pendingTrainings,
    expiredTrainings,
  };
};
