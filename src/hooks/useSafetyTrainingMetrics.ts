import { useQuery } from "@tanstack/react-query";
import { getSafetyTrainingMetrics, SafetyTrainingMetricsResult } from "@/services/safetyTrainingMetrics";
import { useCompany } from "@/contexts/CompanyContext";

export const useSafetyTrainingMetrics = () => {
  const { selectedCompany } = useCompany();

  return useQuery<SafetyTrainingMetricsResult>({
    queryKey: ['safety-training-metrics', selectedCompany?.id],
    queryFn: () => getSafetyTrainingMetrics(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
    staleTime: 5 * 60 * 1000,
  });
};
