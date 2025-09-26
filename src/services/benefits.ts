import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Benefit {
  id: string;
  name: string;
  type: string;
  description?: string;
  monthly_cost: number;
  eligibility_rules?: string;
  is_active: boolean;
  provider?: string;
  contract_number?: string;
  created_at: string;
  updated_at: string;
  participants?: number;
  total_employees?: number;
}

export interface BenefitEnrollment {
  id: string;
  benefit_id: string;
  employee_id: string;
  enrollment_date: string;
  is_active: boolean;
}

export interface CreateBenefitData {
  name: string;
  type: string;
  description?: string;
  monthly_cost: number;
  eligibility_rules?: string;
  is_active: boolean;
  provider?: string;
  contract_number?: string;
}

export const useBenefits = () => {
  return {
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_benefits')
        .select(`
          *,
          enrollments:benefit_enrollments(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching benefits:', error);
        toast.error('Erro ao carregar benefícios');
        throw error;
      }

      // Get total employees count
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo');

      return data?.map((benefit) => ({
        ...benefit,
        participants: benefit.enrollments?.[0]?.count || 0,
        total_employees: totalEmployees || 0,
      })) || [];
    },
  };
};

export const createBenefit = async (benefitData: CreateBenefitData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    throw new Error('Empresa não encontrada para o usuário');
  }

  const { data, error } = await supabase
    .from('employee_benefits')
    .insert({
      ...benefitData,
      company_id: profile.company_id,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating benefit:', error);
    throw error;
  }

  return data;
};

export const updateBenefit = async (id: string, benefitData: Partial<CreateBenefitData>) => {
  const { data, error } = await supabase
    .from('employee_benefits')
    .update({
      ...benefitData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating benefit:', error);
    throw error;
  }

  return data;
};

export const deleteBenefit = async (id: string) => {
  const { error } = await supabase
    .from('employee_benefits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting benefit:', error);
    throw error;
  }
};

export const getBenefitStats = async () => {
  // Get total benefits cost
  const { data: benefitsCosts } = await supabase
    .from('employee_benefits')
    .select('monthly_cost')
    .eq('is_active', true);

  const totalBenefitsCost = benefitsCosts?.reduce((sum, benefit) => sum + (benefit.monthly_cost || 0), 0) || 0;

  // Get total enrollments
  const { count: totalEnrollments } = await supabase
    .from('benefit_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get total employees
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Ativo');

  const participationRate = totalEmployees ? Math.round((totalEnrollments || 0) / totalEmployees * 100) : 0;

  return {
    totalBenefitsCost,
    benefitParticipation: participationRate,
    totalEnrollments: totalEnrollments || 0,
    totalEmployees: totalEmployees || 0,
  };
};

export const enrollEmployeeInBenefit = async (benefitId: string, employeeId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Get user's company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    throw new Error('Empresa não encontrada para o usuário');
  }

  const { data, error } = await supabase
    .from('benefit_enrollments')
    .insert({
      benefit_id: benefitId,
      employee_id: employeeId,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error enrolling employee in benefit:', error);
    throw error;
  }

  return data;
};

export const unenrollEmployeeFromBenefit = async (benefitId: string, employeeId: string) => {
  const { error } = await supabase
    .from('benefit_enrollments')
    .delete()
    .eq('benefit_id', benefitId)
    .eq('employee_id', employeeId);

  if (error) {
    console.error('Error unenrolling employee from benefit:', error);
    throw error;
  }
};