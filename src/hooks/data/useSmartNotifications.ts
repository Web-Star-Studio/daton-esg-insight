import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  priority: 'critical' | 'important' | 'info';
  action_type?: 'view' | 'edit' | 'approve' | 'complete';
  action_data?: any;
  created_at: string;
  read_at?: string;
  type: string;
}

export const useSmartNotifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['smart-notifications'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company not found');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', userAndCompany.company_id)
        .is('read_at', null)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((n): SmartNotification => ({
        id: n.id,
        title: n.title,
        message: n.message,
        priority: (n.priority as any) || 'info',
        action_type: n.action_type as any,
        action_data: n.action_data,
        created_at: n.created_at,
        read_at: n.read_at || undefined,
        type: n.type || 'general'
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany?.company_id) {
        throw new Error('Company not found');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('company_id', userAndCompany.company_id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
    },
  });

  const criticalCount = notifications?.filter(n => n.priority === 'critical').length || 0;
  const importantCount = notifications?.filter(n => n.priority === 'important').length || 0;

  return {
    notifications: notifications || [],
    isLoading,
    criticalCount,
    importantCount,
    totalUnread: notifications?.length || 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};
