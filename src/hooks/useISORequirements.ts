import { useQuery } from "@tanstack/react-query";
import { isoRequirementsService, ISOStandardType } from "@/services/isoRequirements";

export function useISORequirements(standard?: ISOStandardType) {
  const { data: allRequirements, isLoading: loadingAll } = useQuery({
    queryKey: ['iso-requirements'],
    queryFn: () => isoRequirementsService.getAllRequirements(),
    enabled: !standard,
  });

  const { data: standardRequirements, isLoading: loadingStandard } = useQuery({
    queryKey: ['iso-requirements', standard],
    queryFn: () => standard ? isoRequirementsService.getRequirementsByStandard(standard) : Promise.resolve([]),
    enabled: !!standard,
  });

  return {
    requirements: standard ? standardRequirements : allRequirements,
    isLoading: standard ? loadingStandard : loadingAll,
    searchRequirements: (term: string) => isoRequirementsService.searchRequirements(term),
  };
}
