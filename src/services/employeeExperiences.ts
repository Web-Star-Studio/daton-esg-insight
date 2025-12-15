import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unifiedToast } from "@/utils/unifiedToast";

export interface EmployeeExperience {
  id: string;
  company_id: string;
  employee_id: string;
  company_name: string;
  position_title: string;
  department?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  reason_for_leaving?: string;
  salary?: number;
  contact_reference?: string;
  created_at: string;
  updated_at: string;
}

export const getEmployeeExperiences = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('employee_experiences')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as EmployeeExperience[];
};

export const createEmployeeExperience = async (experience: Omit<EmployeeExperience, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    throw new Error('Usuário não autenticado');
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error('Empresa do usuário não encontrada');
  }

  const { data, error } = await supabase
    .from('employee_experiences')
    .insert({
      ...experience,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmployeeExperience;
};

export const updateEmployeeExperience = async (id: string, updates: Partial<EmployeeExperience>) => {
  const { data, error } = await supabase
    .from('employee_experiences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EmployeeExperience;
};

export const deleteEmployeeExperience = async (id: string) => {
  const { error } = await supabase
    .from('employee_experiences')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// React Query Hooks
export const useEmployeeExperiences = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-experiences', employeeId],
    queryFn: () => getEmployeeExperiences(employeeId),
    enabled: !!employeeId,
  });
};

export const useCreateEmployeeExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEmployeeExperience,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-experiences', variables.employee_id] });
      unifiedToast.success('Experiência adicionada com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao adicionar experiência', {
        description: error.message
      });
    },
  });
};

export const useUpdateEmployeeExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmployeeExperience> }) => 
      updateEmployeeExperience(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-experiences'] });
      unifiedToast.success('Experiência atualizada com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao atualizar experiência', {
        description: error.message
      });
    },
  });
};

export const useDeleteEmployeeExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployeeExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-experiences'] });
      unifiedToast.success('Experiência removida com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover experiência', {
        description: error.message
      });
    },
  });
};
