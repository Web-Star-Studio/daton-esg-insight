import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useLegislationNotificationTriggers() {
  const queryClient = useQueryClient();

  // Periodic check for legislation reviews (every 4 hours)
  const { data: reviewCheckResult } = useQuery({
    queryKey: ['legislation-review-check'],
    queryFn: async () => {
      console.log('Triggering legislation review check...');
      
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: { action: 'check_legislation_reviews' }
      });

      if (error) {
        console.error('Error checking legislation reviews:', error);
        return null;
      }

      if (data?.result?.created > 0) {
        console.log(`Created ${data.result.created} legislation notifications`);
        // Invalidate notifications queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['audit-notifications'] });
      }

      return data;
    },
    refetchInterval: 4 * 60 * 60 * 1000, // 4 hours
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
  });

  // Manual trigger for immediate check
  const triggerLegislationReviewCheck = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: { action: 'check_legislation_reviews' }
      });

      if (error) {
        console.error('Error triggering legislation review check:', error);
        toast.error('Erro ao verificar revisões de legislações');
        return null;
      }

      if (data?.result?.created > 0) {
        toast.success(`${data.result.created} novas notificações de legislação criadas`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
      }

      return data;
    } catch (err) {
      console.error('Failed to trigger legislation review check:', err);
      return null;
    }
  }, [queryClient]);

  // Trigger notification when legislation is created
  const onLegislationCreated = useCallback(async (legislationId: string, title: string) => {
    console.log(`Legislation created: ${title} (${legislationId})`);
    // The database trigger will handle the notification
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  // Trigger notification when legislation status changes
  const onLegislationStatusChanged = useCallback(async (
    legislationId: string, 
    title: string, 
    newStatus: string
  ) => {
    console.log(`Legislation status changed: ${title} -> ${newStatus}`);
    // The database trigger will handle the notification
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  // Trigger notification when legislation is revoked
  const onLegislationRevoked = useCallback(async (
    legislationId: string, 
    title: string
  ) => {
    console.log(`Legislation revoked: ${title}`);
    // The database trigger will handle the notification
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  // Trigger notification when responsible user is assigned
  const onResponsibleAssigned = useCallback(async (
    legislationId: string, 
    title: string, 
    userId: string
  ) => {
    console.log(`Responsible assigned to legislation: ${title} -> ${userId}`);
    // The database trigger will handle the notification
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  return {
    reviewCheckResult,
    triggerLegislationReviewCheck,
    onLegislationCreated,
    onLegislationStatusChanged,
    onLegislationRevoked,
    onResponsibleAssigned,
    isMonitoringActive: true,
  };
}
