import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HealthScoreResult {
  companyId: string;
  companyName: string;
  score: number;
  category: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
  factors: {
    loginFrequency: { score: number; weight: number };
    featureAdoption: { score: number; weight: number };
    dataCompleteness: { score: number; weight: number };
    userEngagement: { score: number; weight: number };
    systemHealth: { score: number; weight: number };
  };
  recommendations: string[];
  lastCalculated: string;
}

export function useCompanyHealthScore(companyId: string | null) {
  return useQuery({
    queryKey: ['company-health-score', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase.functions.invoke('company-health-score', {
        body: { companyId }
      });

      if (error) throw error;
      return data as HealthScoreResult;
    },
    enabled: !!companyId,
  });
}
