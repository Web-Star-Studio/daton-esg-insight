/**
 * Hook to fetch notification counts for sidebar badges
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/constants/queryKeys';

interface NotificationCounts {
  licenses_expiring: number;
  pending_audits: number;
  open_non_conformities: number;
  pending_trainings: number;
  unread_notifications: number;
  pending_approvals: number;
}

export function useNotificationCounts() {
  const { user } = useAuth();
  const companyId = user?.company?.id;

  return useQuery({
    queryKey: ['notification-counts', companyId],
    queryFn: async (): Promise<NotificationCounts> => {
      if (!companyId || !user?.id) {
        return {
          licenses_expiring: 0,
          pending_audits: 0,
          open_non_conformities: 0,
          pending_trainings: 0,
          unread_notifications: 0,
          pending_approvals: 0,
        };
      }

      try {
        // Simplified counts without complex queries
        const licensesCount = await supabase
          .from('licenses')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const auditsCount = await supabase
          .from('audits')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        return {
          licenses_expiring: licensesCount.count || 0,
          pending_audits: auditsCount.count || 0,
          open_non_conformities: 0,
          pending_trainings: 0,
          unread_notifications: 0,
          pending_approvals: 0,
        };
      } catch (error) {
        return {
          licenses_expiring: 0,
          pending_audits: 0,
          open_non_conformities: 0,
          pending_trainings: 0,
          unread_notifications: 0,
          pending_approvals: 0,
        };
      }
    },
    enabled: !!companyId && !!user,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}