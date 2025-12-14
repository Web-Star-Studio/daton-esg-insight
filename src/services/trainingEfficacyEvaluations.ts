import { supabase } from "@/integrations/supabase/client";
import { calculateTrainingStatus, checkHasEfficacyEvaluation } from "@/utils/trainingStatusCalculator";

export interface TrainingEfficacyEvaluation {
  id: string;
  company_id: string;
  employee_training_id: string;
  training_program_id: string;
  evaluator_id?: string;
  evaluator_name?: string;
  evaluation_date: string;
  score?: number;
  is_effective?: boolean;
  comments?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const getEfficacyEvaluations = async (trainingProgramId?: string) => {
  let query = supabase
    .from('training_efficacy_evaluations')
    .select('*')
    .order('created_at', { ascending: false });

  if (trainingProgramId) {
    query = query.eq('training_program_id', trainingProgramId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as TrainingEfficacyEvaluation[];
};

export const getEfficacyEvaluation = async (id: string) => {
  const { data, error } = await supabase
    .from('training_efficacy_evaluations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TrainingEfficacyEvaluation;
};

export const createEfficacyEvaluation = async (
  evaluation: Omit<TrainingEfficacyEvaluation, 'id' | 'created_at' | 'updated_at'>
) => {
  console.log('Creating efficacy evaluation:', evaluation);

  const { data: companyId, error: companyError } = await supabase.rpc('get_user_company_id');
  if (companyError || !companyId) {
    throw new Error('Empresa não encontrada para o usuário atual');
  }

  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    company_id: companyId as string,
    employee_training_id: evaluation.employee_training_id,
    training_program_id: evaluation.training_program_id,
    evaluator_id: userData?.user?.id || null,
    evaluator_name: evaluation.evaluator_name || null,
    evaluation_date: evaluation.evaluation_date,
    score: evaluation.score ?? null,
    is_effective: evaluation.is_effective ?? null,
    comments: evaluation.comments || null,
    status: evaluation.status || 'Concluída',
  };

  const { data, error } = await supabase
    .from('training_efficacy_evaluations')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating efficacy evaluation:', error);
    throw new Error(`Erro ao criar avaliação de eficácia: ${error.message}`);
  }

  // Update the training program status after creating efficacy evaluation
  if (evaluation.status === 'Concluída' && evaluation.training_program_id) {
    try {
      // Get the training program
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('id', evaluation.training_program_id)
        .single();

      if (!programError && program) {
        // Recalculate status with efficacy evaluation now completed
        const newStatus = calculateTrainingStatus({
          start_date: program.start_date,
          end_date: program.end_date,
          efficacy_evaluation_deadline: program.efficacy_evaluation_deadline,
          hasEfficacyEvaluation: true,
        });

        // Update the program status
        await supabase
          .from('training_programs')
          .update({ status: newStatus })
          .eq('id', evaluation.training_program_id);
        
        console.log('Training program status updated to:', newStatus);
      }
    } catch (statusError) {
      console.error('Error updating training program status:', statusError);
      // Don't throw here - the evaluation was created successfully
    }
  }

  console.log('Efficacy evaluation created successfully:', data);
  return data as TrainingEfficacyEvaluation;
};

export const updateEfficacyEvaluation = async (
  id: string,
  updates: Partial<TrainingEfficacyEvaluation>
) => {
  const { data, error } = await supabase
    .from('training_efficacy_evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating efficacy evaluation:', error);
    throw new Error(`Erro ao atualizar avaliação de eficácia: ${error.message}`);
  }

  return data as TrainingEfficacyEvaluation;
};

export const deleteEfficacyEvaluation = async (id: string) => {
  const { error } = await supabase
    .from('training_efficacy_evaluations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting efficacy evaluation:', error);
    throw new Error(`Erro ao excluir avaliação de eficácia: ${error.message}`);
  }
};

export const getPendingEvaluations = async () => {
  const { data, error } = await supabase
    .from('training_efficacy_evaluations')
    .select(`
      *,
      training_programs:training_program_id (
        id,
        name,
        category,
        responsible_name,
        responsible_email
      ),
      employee_trainings:employee_training_id (
        id,
        employee_id,
        completion_date,
        employees:employee_id (
          id,
          full_name,
          department
        )
      )
    `)
    .eq('status', 'Pendente')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getEvaluationMetrics = async () => {
  const { data: evaluations, error } = await supabase
    .from('training_efficacy_evaluations')
    .select('*');

  if (error) throw error;

  const total = evaluations?.length || 0;
  const completed = evaluations?.filter(e => e.status === 'Concluída').length || 0;
  const pending = evaluations?.filter(e => e.status === 'Pendente').length || 0;
  const effective = evaluations?.filter(e => e.is_effective === true).length || 0;
  const avgScore = evaluations
    ?.filter(e => e.score !== null)
    .reduce((sum, e) => sum + (e.score || 0), 0) / (evaluations?.filter(e => e.score !== null).length || 1);

  return {
    total,
    completed,
    pending,
    effective,
    effectiveRate: completed > 0 ? (effective / completed) * 100 : 0,
    avgScore: Number(avgScore.toFixed(1)),
  };
};
