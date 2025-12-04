import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface CareerDevelopmentPlan {
  id: string;
  company_id: string;
  employee_id: string;
  current_position: string;
  target_position: string;
  start_date: string;
  target_date: string;
  status: string;
  progress_percentage: number;
  mentor_id?: string;
  goals: any[] | any;
  skills_to_develop: any[] | any;
  development_activities: any[] | any;
  notes?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  employee?: {
    id: string;
    full_name: string;
    employee_code: string;
    department?: string;
  };
  mentor?: {
    id: string;
    full_name: string;
  };
}

export interface SuccessionPlan {
  id: string;
  company_id: string;
  position_title: string;
  department: string;
  current_holder_id?: string;
  critical_level: string;
  expected_retirement_date?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  current_holder?: {
    id: string;
    full_name: string;
  };
  candidates?: SuccessionCandidate[];
}

export interface SuccessionCandidate {
  id: string;
  succession_plan_id: string;
  employee_id: string;
  readiness_level: string;
  readiness_score: number;
  development_needs: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  employee?: {
    id: string;
    full_name: string;
  };
}

export interface MentoringRelationship {
  id: string;
  company_id: string;
  mentor_id: string;
  mentee_id: string;
  program_name: string;
  start_date: string;
  end_date?: string;
  status: string;
  objectives: any[];
  meeting_frequency: string;
  progress_notes?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  mentor?: {
    id: string;
    full_name: string;
  };
  mentee?: {
    id: string;
    full_name: string;
  };
}

export interface InternalJobPosting {
  id: string;
  company_id: string;
  title: string;
  department: string;
  location?: string;
  employment_type: string;
  level: string;
  description?: string;
  requirements: any[];
  benefits: any[];
  salary_range_min?: number;
  salary_range_max?: number;
  application_deadline: string;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Career Development Plans
export const getCareerDevelopmentPlans = async () => {
  const { data, error } = await supabase
    .from('career_development_plans')
    .select(`
      *,
      employee:employees!employee_id(id, full_name, employee_code, department),
      mentor:employees!mentor_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Helper para normalizar UUIDs - converte strings vazias para null
const normalizeUUID = (value: string | null | undefined): string | null => {
  if (!value || value === '' || value === 'undefined' || value === 'null') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

// Remove propriedades undefined e converte "" para null em campos UUID
const cleanDataForSupabase = (data: Record<string, any>): Record<string, any> => {
  const uuidFields = ['company_id', 'employee_id', 'mentor_id', 'created_by_user_id'];
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Não incluir undefined - Supabase pode serializar como ""
    if (value === undefined) {
      continue;
    }
    // Converter "" para null em campos UUID
    if (uuidFields.includes(key) && value === '') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

export const createCareerDevelopmentPlan = async (plan: Omit<CareerDevelopmentPlan, 'id' | 'created_at' | 'updated_at'>) => {
  // Primeiro normalizar os campos específicos
  const withNormalizedFields = {
    ...plan,
    mentor_id: normalizeUUID(plan.mentor_id),
    notes: plan.notes && plan.notes.trim() !== '' ? plan.notes : null,
  };
  
  // Depois limpar dados para Supabase (remove undefined, converte "" para null)
  const normalized = cleanDataForSupabase(withNormalizedFields) as typeof plan;

  const { data, error } = await supabase
    .from('career_development_plans')
    .insert(normalized)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao criar plano de desenvolvimento: ${error.message}`);
  if (!data) throw new Error('Não foi possível criar o plano de desenvolvimento');
  return data;
};

export const updateCareerDevelopmentPlan = async (id: string, updates: Partial<CareerDevelopmentPlan>) => {
  const { data, error } = await supabase
    .from('career_development_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao atualizar plano de desenvolvimento: ${error.message}`);
  if (!data) throw new Error('Plano de desenvolvimento não encontrado');
  return data;
};

// Succession Plans
export const getSuccessionPlans = async () => {
  const { data, error } = await supabase
    .from('succession_plans')
    .select(`
      *,
      current_holder:employees!current_holder_id(id, full_name),
      candidates:succession_candidates(
        *,
        employee:employees!employee_id(id, full_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSuccessionPlan = async (plan: Omit<SuccessionPlan, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('succession_plans')
    .insert(plan)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao criar plano de sucessão: ${error.message}`);
  if (!data) throw new Error('Não foi possível criar o plano de sucessão');
  return data;
};

// Mentoring Relationships
export const getMentoringRelationships = async () => {
  const { data, error } = await supabase
    .from('mentoring_relationships')
    .select(`
      *,
      mentor:employees!mentor_id(id, full_name),
      mentee:employees!mentee_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createMentoringRelationship = async (relationship: Omit<MentoringRelationship, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('mentoring_relationships')
    .insert(relationship)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao criar relacionamento de mentoria: ${error.message}`);
  if (!data) throw new Error('Não foi possível criar o relacionamento de mentoria');
  return data;
};

// Internal Job Postings
export const getInternalJobPostings = async () => {
  const { data, error } = await supabase
    .from('internal_job_postings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createInternalJobPosting = async (posting: Omit<InternalJobPosting, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('internal_job_postings')
    .insert(posting)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao criar vaga interna: ${error.message}`);
  if (!data) throw new Error('Não foi possível criar a vaga interna');
  return data;
};

// Career Statistics
export const getCareerStatistics = async () => {
  // Get employees count
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id')
    .eq('status', 'Ativo');

  if (employeesError) throw employeesError;

  // Get active PDIs
  const { data: activePDIs, error: pdisError } = await supabase
    .from('career_development_plans')
    .select('id')
    .eq('status', 'Em Andamento');

  if (pdisError) throw pdisError;

  // Get mentoring relationships
  const { data: mentoring, error: mentoringError } = await supabase
    .from('mentoring_relationships')
    .select('id')
    .eq('status', 'Ativo');

  if (mentoringError) throw mentoringError;

  // Get internal job postings
  const { data: jobPostings, error: jobsError } = await supabase
    .from('internal_job_postings')
    .select('id')
    .eq('status', 'Aberto');

  if (jobsError) throw jobsError;

  return {
    totalEmployees: employees?.length || 0,
    activeIDPs: activePDIs?.length || 0,
    promotionsThisYear: 0, // TODO: Track promotions
    skillGapsCovered: 78, // TODO: Calculate from competency assessments
    mentoringPairs: mentoring?.length || 0,
    successionsPlanned: 0, // TODO: Count succession plans
    internalMobility: 15, // TODO: Track internal moves
    careerSatisfaction: 4.2 // TODO: From surveys
  };
};

// React Query Hooks
export const useCareerDevelopmentPlans = () => {
  return useQuery({
    queryKey: ['career-development-plans'],
    queryFn: getCareerDevelopmentPlans,
    staleTime: 30000,
  });
};

export const useSuccessionPlans = () => {
  return useQuery({
    queryKey: ['succession-plans'],
    queryFn: getSuccessionPlans,
    staleTime: 30000,
  });
};

export const useMentoringRelationships = () => {
  return useQuery({
    queryKey: ['mentoring-relationships'],
    queryFn: getMentoringRelationships,
    staleTime: 30000,
  });
};

export const useInternalJobPostings = () => {
  return useQuery({
    queryKey: ['internal-job-postings'],
    queryFn: getInternalJobPostings,
    staleTime: 30000,
  });
};

export const useCareerStatistics = () => {
  return useQuery({
    queryKey: ['career-statistics'],
    queryFn: getCareerStatistics,
    staleTime: 60000,
  });
};

// Mutations
export const useCreateCareerPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCareerDevelopmentPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-development-plans'] });
      queryClient.invalidateQueries({ queryKey: ['career-statistics'] });
    },
  });
};

export const useUpdateCareerPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CareerDevelopmentPlan> }) =>
      updateCareerDevelopmentPlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-development-plans'] });
    },
  });
};

export const useCreateSuccessionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSuccessionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['succession-plans'] });
      queryClient.invalidateQueries({ queryKey: ['career-statistics'] });
    },
  });
};

export const useCreateMentoringRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMentoringRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['career-statistics'] });
    },
  });
};

export const useCreateJobPosting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInternalJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-job-postings'] });
    },
  });
};

// Create succession candidate
export const createSuccessionCandidate = async (
  candidate: Omit<SuccessionCandidate, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('succession_candidates')
    .insert([candidate])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Hook for creating succession candidates
export const useCreateSuccessionCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSuccessionCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['succession-plans'] });
    },
  });
};

// Job Applications
export const getInternalJobApplications = async (jobPostingId?: string) => {
  let query = supabase
    .from('job_applications')
    .select(`
      *,
      job_posting:internal_job_postings(title, department),
      employee:employees(id, full_name, employee_code, position)
    `)
    .order('application_date', { ascending: false });
  
  if (jobPostingId) {
    query = query.eq('job_posting_id', jobPostingId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createInternalJobApplication = async (application: any) => {
  const { data, error } = await supabase
    .from('job_applications')
    .insert(application)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const checkUserApplication = async (jobPostingId: string, employeeId: string) => {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_posting_id', jobPostingId)
    .eq('employee_id', employeeId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

export const useInternalJobApplications = (jobPostingId?: string) => {
  return useQuery({
    queryKey: ['internal-job-applications', jobPostingId],
    queryFn: () => getInternalJobApplications(jobPostingId),
  });
};

export const useCreateInternalJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createInternalJobApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['internal-job-postings'] });
    },
  });
};