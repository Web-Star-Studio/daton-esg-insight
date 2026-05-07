import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import {
  fetchAllComplianceProfiles,
  fetchComplianceProfile,
  generateProfileTags,
  upsertComplianceProfile,
} from "@/services/complianceProfiles";

export const useComplianceProfile = (branchId: string | undefined) =>
  useQuery({
    queryKey: ["compliance-profile", branchId],
    queryFn: () => fetchComplianceProfile(branchId!),
    enabled: !!branchId,
  });

export const useAllComplianceProfiles = () => {
  const { selectedCompany } = useCompany();

  return useQuery({
    queryKey: ["compliance-profiles", selectedCompany?.id],
    queryFn: () => fetchAllComplianceProfiles(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });
};

export const useUpsertComplianceProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertComplianceProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compliance-profile", data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["compliance-profiles"] });
      toast.success("Questionário de compliance enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar questionário: " + error.message);
    },
  });
};

export const useProfileTags = (branchId: string | undefined) => {
  const { data: profile } = useComplianceProfile(branchId);
  return generateProfileTags(profile);
};

export const useAllProfileTags = () => {
  const { data: profiles } = useAllComplianceProfiles();

  if (!profiles?.length) return [] as string[];

  const allTags = new Set<string>();
  profiles.forEach((profile) => generateProfileTags(profile).forEach((tag) => allTags.add(tag)));
  return Array.from(allTags);
};
