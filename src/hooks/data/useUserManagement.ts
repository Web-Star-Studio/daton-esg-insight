import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserAndCompany } from '@/utils/auth';
import { useState, useCallback } from 'react';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  role: string;
  company_id: string;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  is_active?: boolean;
  deleted_at?: string;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  lastLogin24h: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
  orderBy?: 'full_name' | 'email' | 'created_at' | 'role' | 'username';
  orderDir?: 'asc' | 'desc';
}

export interface PaginatedResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper function to call edge function
async function callManageUserFunction(action: string, userData: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action, userData },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const useUserManagement = (initialFilters?: UserFilters) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>(initialFilters || {
    page: 1,
    limit: 20,
    status: 'active',
    orderBy: 'created_at',
    orderDir: 'desc',
  });

  // Fetch paginated users
  const { 
    data: paginatedData, 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['users', filters],
    queryFn: async (): Promise<PaginatedResponse> => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) throw new Error('Company not found');

      const result = await callManageUserFunction('list', { 
        company_id: userAndCompany.company_id,
        ...filters,
        role_filter: filters.role,
        order_by: filters.orderBy,
        order_dir: filters.orderDir,
      });

      return {
        users: result.users as UserProfile[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    },
  });

  const users = paginatedData?.users || [];
  
  // Calculate stats
  const stats: UserStats = {
    total: paginatedData?.total || 0,
    active: users.filter(u => u.is_active !== false).length,
    admins: users.filter(u => ['admin', 'super_admin', 'platform_admin'].includes(u.role)).length,
    lastLogin24h: users.filter(u => {
      const createdAt = new Date(u.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > dayAgo;
    }).length,
  };

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except page itself)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  // Invite user mutation (sends email invitation)
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserProfile>) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
          username: userData.username,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Convite enviado com sucesso! O usuário receberá um email para definir sua senha.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`);
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

  // Soft delete user mutation
  const softDeleteUserMutation = useMutation({
    mutationFn: async ({ userId, reason, fullName }: { userId: string; reason?: string; fullName?: string }) => {
      return await callManageUserFunction('soft_delete', { 
        id: userId, 
        reason,
        full_name: fullName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário desativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar usuário: ${error.message}`);
    },
  });

  // Reactivate user mutation
  const reactivateUserMutation = useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName?: string }) => {
      return await callManageUserFunction('reactivate', { 
        id: userId,
        full_name: fullName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário reativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reativar usuário: ${error.message}`);
    },
  });

  // Hard delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, reason, fullName }: { userId: string; reason?: string; fullName?: string }) => {
      return await callManageUserFunction('delete', { 
        id: userId, 
        reason,
        full_name: fullName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído permanentemente!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      return await callManageUserFunction('reset_password', { 
        id: userId, 
        email,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Link de recuperação de senha enviado! O link expira em 24 horas.');
      // For development/testing, log the link
      if (data?.link) {
        console.log('Password reset link:', data.link);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar link de reset: ${error.message}`);
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async ({ userId, email, full_name, role }: { 
      userId: string; 
      email: string; 
      full_name: string; 
      role: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          full_name,
          role,
          isResend: true,
          user_id: userId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Convite reenviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reenviar convite: ${error.message}`);
    },
  });

  // Check email uniqueness
  const checkEmailUnique = async (email: string, excludeId?: string): Promise<boolean> => {
    try {
      const result = await callManageUserFunction('check_email_unique', { 
        email, 
        excludeId 
      });
      return result.valid;
    } catch {
      return false;
    }
  };

  // Check username uniqueness
  const checkUsernameUnique = async (username: string, excludeId?: string): Promise<boolean> => {
    try {
      const result = await callManageUserFunction('check_username_unique', { 
        username, 
        excludeId 
      });
      return result.valid;
    } catch {
      return false;
    }
  };

  return {
    // Data
    users,
    stats,
    pagination: {
      page: paginatedData?.page || 1,
      limit: paginatedData?.limit || 20,
      total: paginatedData?.total || 0,
      totalPages: paginatedData?.totalPages || 1,
    },
    filters,
    
    // Loading states
    usersLoading,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isSoftDeleting: softDeleteUserMutation.isPending,
    isReactivating: reactivateUserMutation.isPending,
    isResetting: resetPasswordMutation.isPending,
    isResending: resendInviteMutation.isPending,
    
    // Actions
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    softDeleteUser: softDeleteUserMutation.mutate,
    reactivateUser: reactivateUserMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    resendInvite: resendInviteMutation.mutate,
    
    // Filter actions
    updateFilters,
    refetchUsers,
    
    // Validation helpers
    checkEmailUnique,
    checkUsernameUnique,
  };
};
