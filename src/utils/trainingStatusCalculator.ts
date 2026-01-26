import { parseDateSafe } from '@/utils/dateUtils';

/**
 * Calculates the automatic status for training programs based on dates.
 * 
 * Status logic:
 * - Planejado: Start date is in the future
 * - Em Andamento: Currently between start and end dates
 * - Pendente Avaliação: End date has passed AND requires efficacy evaluation AND not yet evaluated
 * - Concluído: End date has passed AND (no efficacy required OR already evaluated)
 */

export type AutomaticTrainingStatus = 
  | 'Planejado'           // Start date hasn't arrived yet
  | 'Em Andamento'        // Currently within the training period (start <= today <= end)
  | 'Pendente Avaliação'  // Training ended + requires efficacy + not evaluated yet
  | 'Concluído';          // Training ended (no efficacy needed) OR efficacy evaluated

export interface TrainingForStatusCalculation {
  start_date?: string | null;
  end_date?: string | null;
  efficacy_evaluation_deadline?: string | null;
  hasEfficacyEvaluation?: boolean; // Whether efficacy has been evaluated
}

/**
 * Calculate the automatic status for a training program based on its dates and efficacy status.
 */
export function calculateTrainingStatus(training: TrainingForStatusCalculation): AutomaticTrainingStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = training.start_date ? parseDateSafe(training.start_date) : null;
  const endDate = training.end_date ? parseDateSafe(training.end_date) : null;
  const requiresEfficacy = !!training.efficacy_evaluation_deadline;
  const hasEfficacyEvaluation = training.hasEfficacyEvaluation || false;

  // If no start date, return Planejado
  if (!startDate) {
    return 'Planejado';
  }

  // Normalize start date to midnight for comparison
  startDate.setHours(0, 0, 0, 0);
  
  // If end date exists, normalize it too
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }

  // Today is before start date = Planejado
  if (today < startDate) {
    return 'Planejado';
  }

  // If there's an end date
  if (endDate) {
    // Today is within the training period (start <= today <= end) = Em Andamento
    if (today >= startDate && today <= endDate) {
      return 'Em Andamento';
    }

    // Today is after end date
    if (today > endDate) {
      // If requires efficacy evaluation and hasn't been evaluated yet = Pendente Avaliação
      if (requiresEfficacy && !hasEfficacyEvaluation) {
        return 'Pendente Avaliação';
      }
      // Otherwise = Concluído
      return 'Concluído';
    }
  } else {
    // No end date but has start date and today >= start = Em Andamento
    // (training is ongoing without a defined end)
    return 'Em Andamento';
  }

  // Default fallback
  return 'Planejado';
}

/**
 * Get the appropriate badge color class for a training status.
 */
export function getTrainingStatusColor(status: string): string {
  switch (status) {
    case 'Planejado':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Em Andamento':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Pendente Avaliação':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Concluído':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    // Legacy status compatibility
    case 'Ativo':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Inativo':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Suspenso':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Check if a training program has an associated efficacy evaluation.
 */
export async function checkHasEfficacyEvaluation(
  supabase: any,
  trainingProgramId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('training_efficacy_evaluations')
    .select('id')
    .eq('training_program_id', trainingProgramId)
    .eq('status', 'Concluída')
    .limit(1);
  
  if (error) {
    console.error('Error checking efficacy evaluation:', error);
    return false;
  }
  
  return (data && data.length > 0);
}
