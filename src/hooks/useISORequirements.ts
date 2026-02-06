import { useQuery } from "@tanstack/react-query";
import { isoRequirementsService, ISOStandardType } from "@/services/isoRequirements";

export function useISORequirements(standard?: ISOStandardType | null) {
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['iso-requirements', standard ?? 'all'],
    queryFn: async () => {
      if (standard) {
        return isoRequirementsService.getRequirementsByStandard(standard);
      }
      return isoRequirementsService.getAllRequirements();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - os requisitos ISO não mudam frequentemente
  });

  return {
    requirements: requirements || [],
    isLoading,
    searchRequirements: (term: string) => isoRequirementsService.searchRequirements(term),
  };
}
