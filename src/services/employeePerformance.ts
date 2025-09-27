import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserAndCompany } from "@/utils/auth";

export interface EvaluationCycle {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  evaluation_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceEvaluation {
  id: string;
  company_id: string;
  cycle_id?: string;
  employee_id: string;
  evaluator_id: string;
  period_start: string;
  period_end: string;
  overall_score?: number;
  status: string;
  self_evaluation_completed: boolean;
  manager_evaluation_completed: boolean;
  final_review_completed: boolean;
  comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  development_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCriteria {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  weight: number;
  max_score: number;
  is_active: boolean;
  created_at: string;
}

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  self_score?: number;
  manager_score?: number;
  final_score?: number;
  comments?: string;
  created_at: string;
}

export interface PerformanceStats {
  pending_evaluations: number;
  completed_evaluations: number;
  completion_percentage: number;
  average_score: number;
  top_performers: number;
}

// Evaluation Cycles
export async function getEvaluationCycles() {
  try {
    const { data, error } = await supabase
      .from('performance_evaluation_cycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar ciclos de avaliação:', error);
    toast.error('Erro ao carregar ciclos de avaliação');
    throw error;
  }
}

export async function createEvaluationCycle(cycleData: {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  evaluation_type: string;
  status: string;
}) {
  try {
    const userWithCompany = await getUserAndCompany();
    if (!userWithCompany?.company_id) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('performance_evaluation_cycles')
      .insert({
        ...cycleData,
        company_id: userWithCompany.company_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar ciclo de avaliação:', error);
    toast.error('Erro ao criar ciclo de avaliação');
    throw error;
  }
}

export async function updateEvaluationCycle(id: string, updates: Partial<EvaluationCycle>) {
  try {
    const { data, error } = await supabase
      .from('performance_evaluation_cycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar ciclo de avaliação:', error);
    toast.error('Erro ao atualizar ciclo de avaliação');
    throw error;
  }
}

// Performance Evaluations
export async function getPerformanceEvaluations() {
  try {
    const { data, error } = await supabase
      .from('performance_evaluations')
      .select(`
        *,
        employee:employees!performance_evaluations_employee_id_fkey(id, full_name, position),
        evaluator:employees!performance_evaluations_evaluator_id_fkey(id, full_name),
        cycle:performance_evaluation_cycles(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    toast.error('Erro ao carregar avaliações de desempenho');
    throw error;
  }
}

export async function createPerformanceEvaluation(evaluationData: {
  cycle_id?: string;
  employee_id: string;
  evaluator_id: string;
  period_start: string;
  period_end: string;
  status: string;
  self_evaluation_completed: boolean;
  manager_evaluation_completed: boolean;
  final_review_completed: boolean;
  comments?: string;
}) {
  try {
    const userWithCompany = await getUserAndCompany();
    if (!userWithCompany?.company_id) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('performance_evaluations')
      .insert({
        ...evaluationData,
        company_id: userWithCompany.company_id,
        status: evaluationData.status || 'pending',
        self_evaluation_completed: false,
        manager_evaluation_completed: false,
        final_review_completed: false,
        cycle_id: evaluationData.cycle_id || null,
        comments: evaluationData.comments || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    toast.error('Erro ao criar avaliação de desempenho');
    throw error;
  }
}

export async function updatePerformanceEvaluation(id: string, updates: Partial<PerformanceEvaluation>) {
  try {
    const { data, error } = await supabase
      .from('performance_evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    toast.error('Erro ao atualizar avaliação de desempenho');
    throw error;
  }
}

// Evaluation Criteria
export async function getEvaluationCriteria() {
  try {
    const { data, error } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('is_active', true)
      .order('weight', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar critérios de avaliação:', error);
    toast.error('Erro ao carregar critérios de avaliação');
    throw error;
  }
}

export async function createEvaluationCriteria(criteriaData: {
  name: string;
  description?: string;
  weight: number;
  max_score: number;
  is_active: boolean;
}) {
  try {
    const userWithCompany = await getUserAndCompany();
    if (!userWithCompany?.company_id) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('evaluation_criteria')
      .insert({
        ...criteriaData,
        company_id: userWithCompany.company_id,
        description: criteriaData.description || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar critério de avaliação:', error);
    toast.error('Erro ao criar critério de avaliação');
    throw error;
  }
}

// Initialize default criteria if none exist
export async function initializeDefaultCriteria() {
  const existingCriteria = await getEvaluationCriteria();
  
  if (existingCriteria.length === 0) {
    const defaultCriteria = [
      { name: 'Qualidade do Trabalho', description: 'Precisão, organização e atenção aos detalhes', weight: 20.0, max_score: 5, is_active: true },
      { name: 'Produtividade', description: 'Capacidade de entregar resultados dentro dos prazos', weight: 20.0, max_score: 5, is_active: true },
      { name: 'Comunicação', description: 'Habilidades de comunicação verbal e escrita', weight: 15.0, max_score: 5, is_active: true },
      { name: 'Trabalho em Equipe', description: 'Colaboração e relacionamento interpessoal', weight: 15.0, max_score: 5, is_active: true },
      { name: 'Liderança', description: 'Capacidade de liderar e influenciar positivamente', weight: 10.0, max_score: 5, is_active: true },
      { name: 'Inovação', description: 'Criatividade e capacidade de propor melhorias', weight: 10.0, max_score: 5, is_active: true },
      { name: 'Comprometimento', description: 'Dedicação e engajamento com os objetivos da empresa', weight: 10.0, max_score: 5, is_active: true }
    ];

    const promises = defaultCriteria.map(criteria => createEvaluationCriteria(criteria));
    await Promise.all(promises);
  }
}

// Evaluation Scores
export async function getEvaluationScores(evaluationId: string) {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .select(`
        *,
        criteria:evaluation_criteria(id, name, description, weight, max_score)
      `)
      .eq('evaluation_id', evaluationId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar notas da avaliação:', error);
    toast.error('Erro ao carregar notas da avaliação');
    throw error;
  }
}

export async function saveEvaluationScore(scoreData: Omit<EvaluationScore, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .upsert([scoreData], { 
        onConflict: 'evaluation_id,criteria_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar nota da avaliação:', error);
    toast.error('Erro ao salvar nota da avaliação');
    throw error;
  }
}

// Statistics
export async function getPerformanceStats(): Promise<PerformanceStats> {
  try {
    // Get evaluation statistics
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('performance_evaluations')
      .select('status, overall_score');

    if (evaluationsError) throw evaluationsError;

    const pending = evaluations?.filter(e => e.status === 'pending').length || 0;
    const completed = evaluations?.filter(e => e.status === 'completed').length || 0;
    const total = evaluations?.length || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const scores = evaluations?.filter(e => e.overall_score !== null).map(e => e.overall_score) || [];
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const topPerformers = scores.filter(score => score >= 4.5).length;

    return {
      pending_evaluations: pending,
      completed_evaluations: completed,
      completion_percentage: completionPercentage,
      average_score: Math.round(averageScore * 100) / 100,
      top_performers: topPerformers
    };
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    toast.error('Erro ao carregar estatísticas de desempenho');
    throw error;
  }
}

// Goals integration (using existing goals table)
export async function getEmployeeGoals() {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        progress_updates:goal_progress_updates(
          id,
          current_value,
          update_date,
          progress_percentage
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar metas dos funcionários:', error);
    toast.error('Erro ao carregar metas dos funcionários');
    throw error;
  }
}

// Get employees for evaluation assignments
export async function getEmployeesForEvaluation() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, position, department')
      .eq('status', 'Ativo')
      .order('full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar funcionários:', error);
    toast.error('Erro ao carregar funcionários para avaliação');
    throw error;
  }
}