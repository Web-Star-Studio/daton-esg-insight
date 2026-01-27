import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unifiedToast } from "@/utils/unifiedToast";

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  cnpj?: string | null;
  address?: string | null;
  street_number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: string | null;
  is_headquarters: boolean;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  parent_branch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BranchWithManager extends Branch {
  manager?: { id: string; full_name: string; } | null;
  parent_branch?: { id: string; name: string; } | null;
}

// Helper para obter company_id do usuário atual com retry para aguardar sessão
const getUserCompanyId = async (): Promise<string | null> => {
  let retries = 3;
  let userData = null;
  
  // Retry para aguardar restauração da sessão após F5
  while (retries > 0) {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      userData = data;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    retries--;
  }
  
  if (!userData?.user?.id) {
    console.warn('[branches] getUserCompanyId: No authenticated user after retries');
    return null;
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .maybeSingle();
    
  return profile?.company_id || null;
};

export const getBranches = async () => {
  const companyId = await getUserCompanyId();
  if (!companyId) {
    console.warn('getBranches: No company_id found for user');
    return [];
  }

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('company_id', companyId)
    .order('is_headquarters', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Branch[];
};

export const getBranchesWithManager = async (): Promise<BranchWithManager[]> => {
  const companyId = await getUserCompanyId();
  if (!companyId) {
    console.warn('getBranchesWithManager: No company_id found for user');
    return [];
  }

  const { data, error } = await supabase
    .from('branches')
    .select(`
      *,
      manager:employees!branches_manager_id_fkey(id, full_name)
    `)
    .eq('company_id', companyId)
    .order('is_headquarters', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  
  // Resolver parent_branch localmente para evitar conflito de RLS com self-join
  const branchMap = new Map((data || []).map((b: any) => [b.id, b]));
  
  return (data || []).map((branch: any) => ({
    ...branch,
    manager: branch.manager || null,
    parent_branch: branch.parent_branch_id 
      ? { id: branch.parent_branch_id, name: branchMap.get(branch.parent_branch_id)?.name || 'Desconhecido' }
      : null,
  })) as BranchWithManager[];
};

export const getHeadquarters = async (): Promise<Branch[]> => {
  const companyId = await getUserCompanyId();
  if (!companyId) {
    console.warn('getHeadquarters: No company_id found for user');
    return [];
  }

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_headquarters', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Branch[];
};

export const createBranch = async (branch: Omit<Branch, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData?.user?.id)
    .single();

  const { data, error } = await supabase
    .from('branches')
    .insert({
      ...branch,
      company_id: profile?.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Branch;
};

export const updateBranch = async (id: string, updates: Partial<Branch>) => {
  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Branch;
};

export const deleteBranch = async (id: string) => {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Exclui uma filial com todos os dados vinculados (cascade manual)
 * - Remove programas de treinamento e dependências
 * - Remove avaliações LAIA
 * - Remove perfis de compliance de legislação
 * - Desvincula colaboradores (branch_id = NULL)
 */
export const deleteBranchWithDependencies = async (id: string) => {
  // 1. Buscar training_programs da filial
  const { data: programs } = await supabase
    .from('training_programs')
    .select('id')
    .eq('branch_id', id);
  
  const programIds = programs?.map(p => p.id) || [];
  
  if (programIds.length > 0) {
    // 2. Buscar employee_trainings desses programas
    const { data: trainings } = await supabase
      .from('employee_trainings')
      .select('id')
      .in('training_program_id', programIds);
    
    const trainingIds = trainings?.map(t => t.id) || [];
    
    // 3. Deletar efficacy evaluations
    if (trainingIds.length > 0) {
      await supabase
        .from('training_efficacy_evaluations')
        .delete()
        .in('employee_training_id', trainingIds);
    }
    
    // 4. Deletar employee_trainings
    await supabase
      .from('employee_trainings')
      .delete()
      .in('training_program_id', programIds);
    
    // 5. Deletar training_documents
    await supabase
      .from('training_documents')
      .delete()
      .in('training_program_id', programIds);
    
    // 6. Deletar training_schedules
    await supabase
      .from('training_schedules')
      .delete()
      .in('training_program_id', programIds);
    
    // 7. Deletar training_programs
    await supabase
      .from('training_programs')
      .delete()
      .eq('branch_id', id);
  }
  
  // 8. Deletar laia_assessments
  await supabase
    .from('laia_assessments')
    .delete()
    .eq('branch_id', id);
  
  // 9. Deletar legislation_unit_compliance
  await supabase
    .from('legislation_unit_compliance')
    .delete()
    .eq('branch_id', id);
  
  // 10. Deletar legislation_compliance_profiles
  await supabase
    .from('legislation_compliance_profiles')
    .delete()
    .eq('branch_id', id);
  
  // 11. Desvincular colaboradores (não deletar)
  await supabase
    .from('employees')
    .update({ branch_id: null })
    .eq('branch_id', id);
  
  // 12. Deletar a filial
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// React Query Hooks
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    retry: 2,
    retryDelay: 500,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

export const useBranchesWithManager = () => {
  return useQuery({
    queryKey: ['branches', 'with-manager'],
    queryFn: getBranchesWithManager,
    retry: 2,
    retryDelay: 500,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      unifiedToast.success('Filial criada com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao criar filial', {
        description: error.message
      });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Branch> }) => 
      updateBranch(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      unifiedToast.success('Filial atualizada com sucesso');
    },
    onError: (error: any) => {
      // Tratar erro de CNPJ duplicado
      if (error?.message?.includes("idx_branches_cnpj_unique") || error?.message?.includes("duplicate key")) {
        unifiedToast.error('CNPJ já cadastrado', {
          description: 'Este CNPJ já está em uso por outra filial. Verifique os dados.'
        });
      } else {
        unifiedToast.error('Erro ao atualizar filial', {
          description: error.message
        });
      }
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteBranchWithDependencies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      unifiedToast.success('Filial removida com sucesso', {
        description: 'Todos os dados vinculados foram removidos e colaboradores desvinculados.'
      });
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover filial', {
        description: error.message
      });
    },
  });
};
