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
 * - Remove programas de treinamento e dependências (incluindo participantes de agenda)
 * - Remove avaliações LAIA
 * - Remove perfis de compliance de legislação
 * - Desvincula colaboradores (branch_id = NULL)
 * 
 * IMPORTANTE: Cada etapa valida erros para evitar falhas silenciosas
 */
export const deleteBranchWithDependencies = async (id: string) => {
  console.log(`[deleteBranch] Iniciando exclusão da filial ${id}`);

  // 1. Buscar training_programs da filial
  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('id')
    .eq('branch_id', id);
  
  if (programsError) {
    throw new Error(`Falha ao buscar programas de treinamento: ${programsError.message}`);
  }
  
  const programIds = programs?.map(p => p.id) || [];
  console.log(`[deleteBranch] Encontrados ${programIds.length} programas de treinamento`);
  
  if (programIds.length > 0) {
    // 2. Buscar training_schedules desses programas
    const { data: schedules, error: schedulesError } = await supabase
      .from('training_schedules')
      .select('id')
      .in('training_program_id', programIds);
    
    if (schedulesError) {
      throw new Error(`Falha ao buscar agendamentos: ${schedulesError.message}`);
    }
    
    const scheduleIds = schedules?.map(s => s.id) || [];
    console.log(`[deleteBranch] Encontrados ${scheduleIds.length} agendamentos`);
    
    // 3. Deletar training_schedule_participants pelos schedule_id
    if (scheduleIds.length > 0) {
      const { error: participantsError } = await supabase
        .from('training_schedule_participants')
        .delete()
        .in('schedule_id', scheduleIds);
      
      if (participantsError) {
        throw new Error(`Falha ao remover participantes de agendamentos: ${participantsError.message}`);
      }
      console.log(`[deleteBranch] Participantes de agendamentos removidos`);
    }
    
    // 4. Deletar training_schedules
    const { error: delSchedulesError } = await supabase
      .from('training_schedules')
      .delete()
      .in('training_program_id', programIds);
    
    if (delSchedulesError) {
      throw new Error(`Falha ao remover agendamentos: ${delSchedulesError.message}`);
    }
    console.log(`[deleteBranch] Agendamentos removidos`);
    
    // 5. Deletar training_efficacy_evaluations por training_program_id (mais direto)
    const { error: evalError } = await supabase
      .from('training_efficacy_evaluations')
      .delete()
      .in('training_program_id', programIds);
    
    if (evalError) {
      throw new Error(`Falha ao remover avaliações de eficácia: ${evalError.message}`);
    }
    console.log(`[deleteBranch] Avaliações de eficácia removidas`);
    
    // 6. Deletar employee_trainings
    const { error: empTrainingsError } = await supabase
      .from('employee_trainings')
      .delete()
      .in('training_program_id', programIds);
    
    if (empTrainingsError) {
      throw new Error(`Falha ao remover registros de treinamento: ${empTrainingsError.message}`);
    }
    console.log(`[deleteBranch] Registros de treinamento removidos`);
    
    // 7. Deletar training_documents
    const { error: docsError } = await supabase
      .from('training_documents')
      .delete()
      .in('training_program_id', programIds);
    
    if (docsError) {
      throw new Error(`Falha ao remover documentos de treinamento: ${docsError.message}`);
    }
    console.log(`[deleteBranch] Documentos de treinamento removidos`);
    
    // 8. Deletar training_programs
    const { error: delProgramsError } = await supabase
      .from('training_programs')
      .delete()
      .eq('branch_id', id);
    
    if (delProgramsError) {
      throw new Error(`Falha ao remover programas de treinamento: ${delProgramsError.message}`);
    }
    console.log(`[deleteBranch] Programas de treinamento removidos`);
  }
  
  // 9. Deletar laia_assessments
  const { error: laiaError } = await supabase
    .from('laia_assessments')
    .delete()
    .eq('branch_id', id);
  
  if (laiaError) {
    throw new Error(`Falha ao remover avaliações LAIA: ${laiaError.message}`);
  }
  console.log(`[deleteBranch] Avaliações LAIA removidas`);
  
  // 10. Deletar legislation_unit_compliance
  const { error: unitCompError } = await supabase
    .from('legislation_unit_compliance')
    .delete()
    .eq('branch_id', id);
  
  if (unitCompError) {
    throw new Error(`Falha ao remover compliance de unidade: ${unitCompError.message}`);
  }
  console.log(`[deleteBranch] Compliance de unidade removido`);
  
  // 11. Deletar legislation_compliance_profiles
  const { error: compProfilesError } = await supabase
    .from('legislation_compliance_profiles')
    .delete()
    .eq('branch_id', id);
  
  if (compProfilesError) {
    throw new Error(`Falha ao remover perfis de compliance: ${compProfilesError.message}`);
  }
  console.log(`[deleteBranch] Perfis de compliance removidos`);
  
  // 12. Desvincular colaboradores (não deletar)
  const { error: empUpdateError } = await supabase
    .from('employees')
    .update({ branch_id: null })
    .eq('branch_id', id);
  
  if (empUpdateError) {
    throw new Error(`Falha ao desvincular colaboradores: ${empUpdateError.message}`);
  }
  console.log(`[deleteBranch] Colaboradores desvinculados`);
  
  // 13. Deletar a filial
  const { error: branchError } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);
  
  if (branchError) {
    throw new Error(`Falha ao remover filial: ${branchError.message}`);
  }
  console.log(`[deleteBranch] Filial ${id} removida com sucesso`);
};

/**
 * Exclui uma MATRIZ e todas as filiais vinculadas a ela (parent_branch_id)
 * Executa deleteBranchWithDependencies para cada filial-filha e depois para a matriz
 */
export const deleteHeadquartersWithChildren = async (id: string) => {
  console.log(`[deleteHQ] Iniciando exclusão da matriz ${id} com filiais vinculadas`);
  
  // 1. Buscar todas as filiais vinculadas a esta matriz
  const { data: childBranches, error: childError } = await supabase
    .from('branches')
    .select('id, name')
    .eq('parent_branch_id', id);
  
  if (childError) {
    throw new Error(`Falha ao buscar filiais vinculadas: ${childError.message}`);
  }
  
  console.log(`[deleteHQ] Encontradas ${childBranches?.length || 0} filiais vinculadas`);
  
  // 2. Excluir cada filial-filha com suas dependências
  for (const child of (childBranches || [])) {
    console.log(`[deleteHQ] Excluindo filial-filha: ${child.name} (${child.id})`);
    await deleteBranchWithDependencies(child.id);
  }
  
  // 3. Excluir a matriz com suas dependências
  console.log(`[deleteHQ] Excluindo matriz com dependências`);
  await deleteBranchWithDependencies(id);
  
  console.log(`[deleteHQ] Matriz ${id} e ${childBranches?.length || 0} filiais excluídas com sucesso`);
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
    mutationFn: async ({ id, isHeadquarters }: { id: string; isHeadquarters: boolean }) => {
      if (isHeadquarters) {
        return deleteHeadquartersWithChildren(id);
      }
      return deleteBranchWithDependencies(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      unifiedToast.success('Unidade removida com sucesso', {
        description: 'Todos os dados vinculados foram removidos.'
      });
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover unidade', {
        description: error.message
      });
    },
  });
};
