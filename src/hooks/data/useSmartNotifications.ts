import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  priority: 'critical' | 'important' | 'info' | 'high' | 'medium' | 'urgent';
  action_type?: 'view' | 'edit' | 'approve' | 'complete';
  action_data?: any;
  action_url?: string;
  action_label?: string;
  created_at: string;
  read_at?: string;
  type: string;
  category?: string;
}

// Map notification categories to icons and styles
export const getCategoryConfig = (category?: string) => {
  switch (category) {
    case 'legislation':
      return { 
        icon: 'Scale', 
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Legislação'
      };
    case 'goal':
      return { 
        icon: 'Target', 
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Meta'
      };
    case 'compliance':
      return { 
        icon: 'ClipboardCheck', 
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        label: 'Compliance'
      };
    case 'ghg':
      return { 
        icon: 'Cloud', 
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        label: 'GEE'
      };
    case 'training':
      return { 
        icon: 'GraduationCap', 
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        label: 'Treinamento'
      };
    default:
      return { 
        icon: 'Bell', 
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Geral'
      };
  }
};

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
        .limit(30);

      if (error) throw error;

      return (data || []).map((n): SmartNotification => ({
        id: n.id,
        title: n.title,
        message: n.message,
        priority: (n.priority as any) || 'info',
        action_type: n.action_type as any,
        action_data: n.action_data,
        action_url: (n as any).action_url,
        action_label: (n as any).action_label,
        created_at: n.created_at,
        read_at: n.read_at || undefined,
        type: n.type || 'general',
        category: (n as any).category
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

  const criticalCount = notifications?.filter(n => 
    n.priority === 'critical' || n.priority === 'urgent'
  ).length || 0;
  
  const importantCount = notifications?.filter(n => 
    n.priority === 'important' || n.priority === 'high'
  ).length || 0;

  const legislationCount = notifications?.filter(n => 
    n.category === 'legislation'
  ).length || 0;

  return {
    notifications: notifications || [],
    isLoading,
    criticalCount,
    importantCount,
    legislationCount,
    totalUnread: notifications?.length || 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    getCategoryConfig,
  };
};
