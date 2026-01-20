import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unifiedToast } from "@/utils/unifiedToast";

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  is_headquarters: boolean;
  address?: string;
  cep?: string;
  neighborhood?: string;
  street_number?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  manager_id?: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BranchWithManager extends Branch {
  manager?: {
    id: string;
    full_name: string;
  } | null;
}

export const getBranches = async () => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('is_headquarters', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Branch[];
};

export const getBranchesWithManager = async (): Promise<BranchWithManager[]> => {
  const { data, error } = await supabase
    .from('branches')
    .select(`
      *,
      manager:profiles(id, full_name)
    `)
    .order('is_headquarters', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  
  // Transform the data to handle the profiles join properly
  return (data || []).map((branch: any) => ({
    ...branch,
    manager: branch.manager || null,
  })) as BranchWithManager[];
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

// React Query Hooks
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });
};

export const useBranchesWithManager = () => {
  return useQuery({
    queryKey: ['branches', 'with-manager'],
    queryFn: getBranchesWithManager,
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
      unifiedToast.error('Erro ao atualizar filial', {
        description: error.message
      });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      unifiedToast.success('Filial removida com sucesso');
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover filial', {
        description: error.message
      });
    },
  });
};
