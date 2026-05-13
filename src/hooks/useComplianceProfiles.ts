import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import {
  fetchAllComplianceProfiles,
  fetchComplianceProfile,
  generateProfileTags,
  updateComplianceResponses,
  upsertComplianceProfile,
  upsertCompliancePreResponses,
} from "@/services/complianceProfiles";
import {
  EMPTY_SUPPRESSION,
  keysToSuppression,
  type Suppression,
} from "@/components/legislation/compliance-questionnaire/suppressionRules";

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

export const useUpsertCompliancePreResponses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCompliancePreResponses,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compliance-profile", data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["compliance-profiles"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar escopo: " + error.message);
    },
  });
};

export const useUpdateComplianceResponses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComplianceResponses,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compliance-profile", data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["compliance-profiles"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar respostas: " + error.message);
    },
  });
};

// Suppression derivada de pre_responses já armazenado na linha. Usa
// suppressed_keys persistido (fonte de verdade), e não recomputa do cliente
// — assim a UI fica consistente mesmo se as regras evoluírem no código sem
// que o usuário tenha reaberto o pré-questionário.
export const useSuppressionForBranch = (branchId: string | undefined): Suppression => {
  const { data: profile } = useComplianceProfile(branchId);
  return useMemo(() => {
    if (!profile) return EMPTY_SUPPRESSION;
    return keysToSuppression(profile.suppressed_keys);
  }, [profile]);
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
