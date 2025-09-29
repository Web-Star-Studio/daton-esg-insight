import { supabase } from "@/integrations/supabase/client";

export interface PGRSPlan {
  id: string;
  company_id: string;
  plan_name: string;
  creation_date: string;
  status: string;
  responsible_user_id?: string;
  version: string;
  approval_date?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePGRSPlanData {
  plan_name: string;
  responsible_user_id?: string;
  version?: string;
  status?: string;
}

export interface WasteSource {
  id: string;
  pgrs_plan_id: string;
  source_name: string;
  source_type: string;
  location?: string;
  description?: string;
  waste_types?: WasteType[];
}

export interface CreateWasteSourceData {
  pgrs_plan_id: string;
  source_name: string;
  source_type: string;
  location?: string;
  description?: string;
}

export interface WasteType {
  id: string;
  source_id: string;
  waste_name: string;
  ibama_code?: string;
  conama_code?: string;
  hazard_class: string;
  composition?: string;
  estimated_quantity_monthly: number;
  unit: string;
}

export interface CreateWasteTypeData {
  source_id: string;
  waste_name: string;
  hazard_class: string;
  ibama_code?: string;
  conama_code?: string;
  composition?: string;
  estimated_quantity_monthly: number;
  unit: string;
}

export interface PGRSProcedure {
  id: string;
  pgrs_plan_id: string;
  procedure_type: string;
  title: string;
  description: string;
  infrastructure_details?: string;
  responsible_role?: string;
  frequency?: string;
}

export interface CreatePGRSProcedureData {
  pgrs_plan_id: string;
  procedure_type: string;
  title: string;
  description: string;
  infrastructure_details?: string;
  responsible_role?: string;
  frequency?: string;
}

export interface PGRSGoal {
  id: string;
  pgrs_plan_id: string;
  goal_type: string;
  waste_type_id?: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  responsible_user_id?: string;
  status: string;
  progress_percentage: number;
}

export interface CreatePGRSGoalData {
  pgrs_plan_id: string;
  goal_type: string;
  target_value: number;
  unit: string;
  deadline: string;
  waste_type_id?: string;
  baseline_value?: number;
  current_value?: number;
  responsible_user_id?: string;
  status?: string;
}

export interface PGRSAction {
  id: string;
  goal_id: string;
  action_description: string;
  responsible_user_id?: string;
  due_date: string;
  status: string;
  completion_date?: string;
  notes?: string;
}

export interface CreatePGRSActionData {
  goal_id: string;
  action_description: string;
  due_date: string;
  responsible_user_id?: string;
  status?: string;
  notes?: string;
}

// Helper function to get current user's company ID
const getCurrentUserCompanyId = async (): Promise<string> => {
  const { data: companyId, error } = await supabase.rpc('get_user_company_id');
  
  if (error) {
    throw new Error(`Erro ao obter empresa do usuário: ${error.message}`);
  }
  
  if (!companyId) {
    throw new Error('Empresa não encontrada no perfil do usuário');
  }
  
  return companyId;
};

// PGRS Plans Management
export const getPGRSPlans = async (): Promise<PGRSPlan[]> => {
  const { data, error } = await supabase
    .from('pgrs_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar planos PGRS: ${error.message}`);
  return data || [];
};

export const getPGRSPlanById = async (id: string): Promise<PGRSPlan | null> => {
  const { data, error } = await supabase
    .from('pgrs_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Erro ao buscar plano PGRS: ${error.message}`);
  return data;
};

export const createPGRSPlan = async (planData: CreatePGRSPlanData): Promise<PGRSPlan> => {
  const companyId = await getCurrentUserCompanyId();
  
  const { data, error } = await supabase
    .from('pgrs_plans')
    .insert({ ...planData, company_id: companyId })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar plano PGRS: ${error.message}`);
  return data;
};

export const updatePGRSPlan = async (id: string, updates: Partial<PGRSPlan>): Promise<PGRSPlan> => {
  const { data, error } = await supabase
    .from('pgrs_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar plano PGRS: ${error.message}`);
  return data;
};

// Waste Sources Management
export const getWasteSourcesByPlan = async (planId: string): Promise<WasteSource[]> => {
  const { data, error } = await supabase
    .from('pgrs_waste_sources')
    .select(`
      *,
      waste_types:pgrs_waste_types(*)
    `)
    .eq('pgrs_plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar fontes geradoras: ${error.message}`);
  return data || [];
};

export const createWasteSource = async (sourceData: CreateWasteSourceData): Promise<WasteSource> => {
  const { data, error } = await supabase
    .from('pgrs_waste_sources')
    .insert(sourceData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar fonte geradora: ${error.message}`);
  return data;
};

export const updateWasteSource = async (id: string, updates: Partial<WasteSource>): Promise<WasteSource> => {
  const { data, error } = await supabase
    .from('pgrs_waste_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar fonte geradora: ${error.message}`);
  return data;
};

export const deleteWasteSource = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pgrs_waste_sources')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar fonte geradora: ${error.message}`);
};

// Waste Types Management
export const createWasteType = async (typeData: CreateWasteTypeData): Promise<WasteType> => {
  const { data, error } = await supabase
    .from('pgrs_waste_types')
    .insert(typeData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar tipo de resíduo: ${error.message}`);
  return data;
};

export const updateWasteType = async (id: string, updates: Partial<WasteType>): Promise<WasteType> => {
  const { data, error } = await supabase
    .from('pgrs_waste_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar tipo de resíduo: ${error.message}`);
  return data;
};

export const deleteWasteType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pgrs_waste_types')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar tipo de resíduo: ${error.message}`);
};

// PGRS Procedures Management
export const getProceduresByPlan = async (planId: string): Promise<PGRSProcedure[]> => {
  const { data, error } = await supabase
    .from('pgrs_procedures')
    .select('*')
    .eq('pgrs_plan_id', planId)
    .order('procedure_type', { ascending: true });

  if (error) throw new Error(`Erro ao buscar procedimentos: ${error.message}`);
  return data || [];
};

export const createProcedure = async (procedureData: CreatePGRSProcedureData): Promise<PGRSProcedure> => {
  const { data, error } = await supabase
    .from('pgrs_procedures')
    .insert(procedureData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar procedimento: ${error.message}`);
  return data;
};

export const updateProcedure = async (id: string, updates: Partial<PGRSProcedure>): Promise<PGRSProcedure> => {
  const { data, error } = await supabase
    .from('pgrs_procedures')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar procedimento: ${error.message}`);
  return data;
};

// PGRS Goals Management
export const getGoalsByPlan = async (planId: string): Promise<PGRSGoal[]> => {
  const { data, error } = await supabase
    .from('pgrs_goals')
    .select('*')
    .eq('pgrs_plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar metas: ${error.message}`);
  return data || [];
};

export const createPGRSGoal = async (goalData: CreatePGRSGoalData): Promise<PGRSGoal> => {
  const { data, error } = await supabase
    .from('pgrs_goals')
    .insert(goalData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar meta: ${error.message}`);
  return data;
};

export const updatePGRSGoal = async (id: string, updates: Partial<PGRSGoal>): Promise<PGRSGoal> => {
  const { data, error } = await supabase
    .from('pgrs_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`);
  return data;
};

// PGRS Actions Management
export const getActionsByGoal = async (goalId: string): Promise<PGRSAction[]> => {
  const { data, error } = await supabase
    .from('pgrs_actions')
    .select('*')
    .eq('goal_id', goalId)
    .order('due_date', { ascending: true });

  if (error) throw new Error(`Erro ao buscar ações: ${error.message}`);
  return data || [];
};

export const createPGRSAction = async (actionData: CreatePGRSActionData): Promise<PGRSAction> => {
  const { data, error } = await supabase
    .from('pgrs_actions')
    .insert(actionData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar ação: ${error.message}`);
  return data;
};

export const updatePGRSAction = async (id: string, updates: Partial<PGRSAction>): Promise<PGRSAction> => {
  const { data, error } = await supabase
    .from('pgrs_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar ação: ${error.message}`);
  return data;
};

// Complete PGRS Plan Data
export const getCompletePGRSPlan = async (planId: string) => {
  const [plan, sources, procedures, goals] = await Promise.all([
    getPGRSPlanById(planId),
    getWasteSourcesByPlan(planId),
    getProceduresByPlan(planId),
    getGoalsByPlan(planId)
  ]);

  return {
    plan,
    sources,
    procedures,
    goals
  };
};