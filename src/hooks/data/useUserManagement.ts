import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserAndCompany } from '@/utils/auth';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_id: string;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  lastLogin24h: number;
}

// Helper function to call edge function
async function callManageUserFunction(action: string, userData: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action, userData },
  });

  if (error) throw error;
  return data;
}

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch all users for the company
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) throw new Error('Company not found');

      const result = await callManageUserFunction('list', { 
        company_id: userAndCompany.company_id 
      });

      return result.users as UserProfile[];
    },
  });

  // Calculate stats
  const stats: UserStats = {
    total: users.length,
    active: users.length, // All non-deleted users are active
    admins: users.filter(u => u.role === 'Admin').length,
    lastLogin24h: users.filter(u => {
      const createdAt = new Date(u.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > dayAgo;
    }).length,
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserProfile>) => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) throw new Error('Company not found');

      return await callManageUserFunction('create', {
        ...userData,
        company_id: userAndCompany.company_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: Partial<UserProfile> & { id: string }) => {
      return await callManageUserFunction('update', {
        id,
        ...userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await callManageUserFunction('delete', { id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar usuário: ${error.message}`);
    },
  });

  return {
    users,
    stats,
    usersLoading,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};
