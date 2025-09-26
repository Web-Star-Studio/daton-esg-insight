import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("competency_matrix")
    .insert([{
      ...competency,
      company_id: null // Will be set by RLS trigger
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
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
    .single();

  if (error) throw error;
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
  const { data, error } = await supabase
    .from("employee_competency_assessments")
    .insert([{
      ...assessment,
      company_id: null // Will be set by RLS trigger
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
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