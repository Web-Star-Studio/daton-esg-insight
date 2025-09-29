import { supabase } from "@/integrations/supabase/client";
import { getUserAndCompany } from "@/utils/auth";

export interface CompetencyMatrix {
  id: string;
  company_id: string;
  competency_name: string;
  competency_category: string;
  description?: string;
  levels: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetencyLevel {
  level: number;
  name: string;
  description: string;
  behaviors: string[];
}

export interface EmployeeCompetencyAssessment {
  id: string;
  company_id: string;
  employee_id: string;
  competency_id: string;
  current_level: number;
  target_level: number;
  assessor_user_id: string;
  assessment_date: string;
  development_plan?: string;
  created_at: string;
  updated_at: string;
}

export const getCompetencyMatrix = async (): Promise<CompetencyMatrix[]> => {
  const { data, error } = await supabase
    .from("competency_matrix")
    .select("*")
    .eq("is_active", true)
    .order("competency_category", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createCompetency = async (competency: {
  competency_name: string;
  competency_category: string;
  description?: string;
  levels: any;
  is_active: boolean;
}) => {
  try {
    const userWithCompany = await getUserAndCompany();
    if (!userWithCompany?.company_id) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from("competency_matrix")
      .insert([{
        ...competency,
        company_id: userWithCompany.company_id
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Erro ao criar competência:', error);
      throw new Error(`Erro ao criar competência: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Não foi possível criar a competência');
    }
    return data;
  } catch (error) {
    console.error('Erro inesperado ao criar competência:', error);
    throw new Error('Erro ao criar competência. Tente novamente.');
  }
};

export const updateCompetency = async (id: string, updates: {
  competency_name?: string;
  competency_category?: string;
  description?: string;
  levels?: any;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from("competency_matrix")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao atualizar competência: ${error.message}`);
  if (!data) throw new Error('Competência não encontrada');
  return data;
};

export const deleteCompetency = async (id: string) => {
  const { error } = await supabase
    .from("competency_matrix")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
};

export const getEmployeeCompetencyAssessments = async () => {
  const { data, error } = await supabase
    .from("employee_competency_assessments")
    .select(`
      *,
      competency:competency_matrix(competency_name, competency_category)
    `)
    .order("assessment_date", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createCompetencyAssessment = async (assessment: {
  employee_id: string;
  competency_id: string;
  current_level: number;
  target_level: number;
  assessor_user_id: string;
  assessment_date: string;
  development_plan?: string;
}) => {
  try {
    const userWithCompany = await getUserAndCompany();
    if (!userWithCompany?.company_id) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from("employee_competency_assessments")
      .insert([{
        ...assessment,
        company_id: userWithCompany.company_id
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Erro ao criar avaliação de competência:', error);
      throw new Error(`Erro ao criar avaliação de competência: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Não foi possível criar a avaliação de competência');
    }
    return data;
  } catch (error) {
    console.error('Erro inesperado ao criar avaliação de competência:', error);
    throw new Error('Erro ao criar avaliação de competência. Tente novamente.');
  }
};

export const getCompetencyGapAnalysis = async () => {
  const { data, error } = await supabase
    .from("employee_competency_assessments")
    .select(`
      *,
      competency:competency_matrix(competency_name, competency_category)
    `);

  if (error) throw error;

  // Calcular lacunas de competência
  const gaps = data?.map(assessment => ({
    ...assessment,
    gap: assessment.target_level - assessment.current_level
  })).filter(item => item.gap > 0) || [];

  return gaps;
};