import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserModuleAccess {
  id: string;
  user_id: string;
  module_key: string;
  has_access: boolean;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserModuleAccess(userId?: string) {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-module-access', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_module_access' as any)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('Failed to fetch user module access:', error.message);
        return [];
      }
      return data as unknown as UserModuleAccess[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const hasAccess = (moduleKey: string): boolean => {
    if (!permissions || permissions.length === 0) return true;
    const perm = permissions.find(p => p.module_key === moduleKey);
    if (!perm) return true; // No record = full access
    return perm.has_access;
  };

  const toggleAccess = useMutation({
    mutationFn: async ({ moduleKey, hasAccess }: { moduleKey: string; hasAccess: boolean }) => {
      if (!userId) throw new Error('No user ID');

      const { data: authUser } = await supabase.auth.getUser();
      const grantedBy = authUser?.user?.id || null;

      const { error } = await supabase
        .from('user_module_access' as any)
        .upsert(
          {
            user_id: userId,
            module_key: moduleKey,
            has_access: hasAccess,
            granted_by: grantedBy,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'user_id,module_key' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-module-access', userId] });
    },
  });

  return {
    permissions,
    isLoading,
    hasAccess,
    toggleAccess,
  };
}
