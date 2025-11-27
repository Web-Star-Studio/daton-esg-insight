import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuditNotificationService } from '@/services/auditNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuditNotifications() {
  const queryClient = useQueryClient();

  // Get current user and company
  const { data: userProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('id, company_id, full_name')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  // Get all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['audit-notifications', userProfile?.id, userProfile?.company_id],
    queryFn: () => {
      if (!userProfile?.id || !userProfile?.company_id) return [];
      return AuditNotificationService.getAllNotifications(
        userProfile.id,
        userProfile.company_id
      );
    },
    enabled: !!userProfile?.id && !!userProfile?.company_id,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      AuditNotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['audit-notifications', userProfile?.id, userProfile?.company_id] 
      });
    },
    onError: () => {
      toast.error('Erro ao marcar notificação como lida');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!userProfile?.id || !userProfile?.company_id) 
        throw new Error('User not found');
      return AuditNotificationService.markAllAsRead(
        userProfile.id,
        userProfile.company_id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['audit-notifications', userProfile?.id, userProfile?.company_id] 
      });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
    onError: () => {
      toast.error('Erro ao marcar todas como lidas');
    }
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
