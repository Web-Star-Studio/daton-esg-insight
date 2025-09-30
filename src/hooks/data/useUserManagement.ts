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

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch all users for the company
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) throw new Error('Company not found');

      // Get profiles with user emails from auth
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', userAndCompany.company_id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth users to fetch emails
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) console.error('Error fetching auth users:', authError);
      
      const authUsers = authData?.users || [];

      // Merge profile data with auth emails
      return profiles.map(profile => {
        const authUser = authUsers.find(u => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'N/A',
        } as UserProfile;
      });
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

      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email!,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          company_id: userAndCompany.company_id,
          role: userData.role || 'User',
        },
      });

      if (error) throw error;
      return data;
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
    mutationFn: async ({ id, email, ...userData }: Partial<UserProfile> & { id: string }) => {
      // Only update profile fields (not email, as it's in auth.users)
      const { full_name, role, phone, department, avatar_url } = userData;
      
      // Prepare update data with only allowed role values
      const updateData: any = { full_name, job_title: department };
      if (role && ['Admin', 'Editor', 'Leitor'].includes(role)) {
        updateData.role = role;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  // Delete user mutation (using Supabase auth admin)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
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
