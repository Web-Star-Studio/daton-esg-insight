import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformAnalytics {
  period: string;
  timestamp: string;
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    newCompanies: number;
    totalUsers: number;
    activeUsers: number;
    totalActivities: number;
  };
  growth: {
    byMonth: Record<string, number>;
    trend: 'up' | 'down' | 'stable';
  };
  engagement: {
    topCompanies: Array<{
      name: string;
      cnpj: string;
      count: number;
    }>;
    averageActivitiesPerCompany: number;
  };
  planDistribution: Record<string, number>;
}

export function usePlatformAnalytics(period: string = '30d') {
  return useQuery({
    queryKey: ['platform-analytics', period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('platform-analytics', {
        body: { period }
      });

      if (error) throw error;
      return data as PlatformAnalytics;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
