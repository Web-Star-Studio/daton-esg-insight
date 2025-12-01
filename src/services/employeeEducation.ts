import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unifiedToast } from "@/utils/unifiedToast";

export interface EmployeeEducation {
  id: string;
  company_id: string;
  employee_id: string;
  education_type: string;
  institution_name: string;
  course_name: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  is_completed: boolean;
  grade?: string;
  certificate_number?: string;
  certificate_url?: string;
  expiration_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const EDUCATION_TYPES = [
  'Graduação',
  'Pós-Graduação',
  'Mestrado',
  'Doutorado',
  'Técnico',
  'Certificação',
  'Curso Livre',
];

export const getEmployeeEducation = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('employee_education')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as EmployeeEducation[];
};

export const createEmployeeEducation = async (education: Omit<EmployeeEducation, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData?.user?.id)
    .single();

  const { data, error } = await supabase
    .from('employee_education')
    .insert({
      ...education,
      company_id: profile?.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmployeeEducation;
};

export const updateEmployeeEducation = async (id: string, updates: Partial<EmployeeEducation>) => {
  const { data, error } = await supabase
    .from('employee_education')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EmployeeEducation;
};

export const deleteEmployeeEducation = async (id: string) => {
  const { error } = await supabase
    .from('employee_education')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// React Query Hooks
export const useEmployeeEducation = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-education', employeeId],
    queryFn: () => getEmployeeEducation(employeeId),
    enabled: !!employeeId,
  });
};

export const useCreateEmployeeEducation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEmployeeEducation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-education', variables.employee_id] });
      unifiedToast.success('Educação adicionada com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao adicionar educação', {
        description: error.message
      });
    },
  });
};

export const useUpdateEmployeeEducation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmployeeEducation> }) => 
      updateEmployeeEducation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-education'] });
      unifiedToast.success('Educação atualizada com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao atualizar educação', {
        description: error.message
      });
    },
  });
};

export const useDeleteEmployeeEducation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployeeEducation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-education'] });
      unifiedToast.success('Educação removida com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover educação', {
        description: error.message
      });
    },
  });
};
