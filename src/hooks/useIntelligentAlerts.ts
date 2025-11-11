import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertMonitoringService } from '@/services/alertMonitoring';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useIntelligentAlerts() {
  const { data: companyId } = useQuery({
    queryKey: ['current-company'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      return data?.company_id || null;
    }
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['intelligent-alerts', companyId],
    queryFn: () => companyId ? AlertMonitoringService.checkAllAlerts(companyId) : [],
    enabled: !!companyId,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  useEffect(() => {
    // Show toast notifications for new alerts
    alerts.forEach(alert => {
      AlertMonitoringService.showAlert(alert);
    });
  }, [alerts.length]); // Only trigger when number of alerts changes

  return {
    alerts,
    hasAlerts: alerts.length > 0
  };
}
