import { supabase } from "@/integrations/supabase/client";
import { calculateTrainingStatus, checkHasEfficacyEvaluation } from "@/utils/trainingStatusCalculator";

export interface TrainingEfficacyEvaluation {
  id: string;
  company_id: string;
  // Pode ser null quando a avaliação é por programa (cobre todos os
  // participantes de uma vez). Default novo em /avaliacao-eficacia.
  employee_training_id: string | null;
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
  console.warn('Creating efficacy evaluation:', evaluation);

  const { data: companyId, error: companyError } = await supabase.rpc('get_user_company_id');
  if (companyError || !companyId) {
    throw new Error('Empresa não encontrada para o usuário atual');
  }

  const { data: userData } = await supabase.auth.getUser();

  // Defesa em profundidade: se o caller não passou evaluator_name, busca o
  // full_name no profile do user logado pra preencher automático.
  let evaluatorName = evaluation.evaluator_name || null;
  if (!evaluatorName && userData?.user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    evaluatorName = profile?.full_name || null;
  }

  const payload = {
    company_id: companyId as string,
    employee_training_id: evaluation.employee_training_id,
    training_program_id: evaluation.training_program_id,
    evaluator_id: userData?.user?.id || null,
    evaluator_name: evaluatorName,
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

  // Atualiza o status do training_program. Programa só vira 'Concluído' quando
  // TODOS os participantes têm evaluation concluída — granularidade por
  // colaborador. Antes passávamos hasEfficacyEvaluation:true cego, o que
  // marcava o programa como Concluído já na primeira avaliação (bug visível
  // na Gabardo: ex. "FORMAÇÃO DE MOTORISTA CEGONHEIRO" com 8 colabs e 1
  // avaliado aparecia como Concluído).
  if (evaluation.status === 'Concluída' && evaluation.training_program_id) {
    try {
      const programId = evaluation.training_program_id;
      const [
        { data: program, error: programError },
        { data: parts },
        { data: evals },
      ] = await Promise.all([
        supabase.from('training_programs').select('*').eq('id', programId).single(),
        supabase.from('employee_trainings').select('id').eq('training_program_id', programId),
        supabase
          .from('training_efficacy_evaluations')
          .select('employee_training_id')
          .eq('training_program_id', programId)
          .eq('status', 'Concluída'),
      ]);

      if (!programError && program) {
        const evaluatedIds = new Set(
          (evals || []).map((e) => e.employee_training_id).filter(Boolean) as string[],
        );
        const totalParts = parts?.length || 0;
        const allEvaluated =
          totalParts > 0 && (parts || []).every((p) => evaluatedIds.has(p.id));

        const newStatus = calculateTrainingStatus({
          start_date: program.start_date,
          end_date: program.end_date,
          efficacy_evaluation_deadline: program.efficacy_evaluation_deadline,
          hasEfficacyEvaluation: allEvaluated,
        });

        await supabase
          .from('training_programs')
          .update({ status: newStatus })
          .eq('id', programId);
      }
    } catch (statusError) {
      console.error('Error updating training program status:', statusError);
      // Não propaga: a evaluation foi criada com sucesso.
    }
  }

  console.warn('Efficacy evaluation created successfully:', data);
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
