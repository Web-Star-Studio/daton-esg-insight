import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import {
  fetchComplianceProfile,
  fetchAllComplianceProfiles,
  upsertComplianceProfile,
  ComplianceProfile,
  generateProfileTags,
} from "@/services/complianceProfiles";

export const useComplianceProfile = (branchId: string | undefined) => {
  return useQuery({
    queryKey: ['compliance-profile', branchId],
    queryFn: () => fetchComplianceProfile(branchId!),
    enabled: !!branchId,
  });
};

export const useAllComplianceProfiles = () => {
  const { selectedCompany } = useCompany();
  
  return useQuery({
    queryKey: ['compliance-profiles', selectedCompany?.id],
    queryFn: () => fetchAllComplianceProfiles(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });
};

export const useUpsertComplianceProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertComplianceProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-profile', data.branch_id] });
      queryClient.invalidateQueries({ queryKey: ['compliance-profiles'] });
      toast.success("Perfil de compliance salvo com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar perfil: " + error.message);
    },
  });
};

// Hook para obter tags do perfil de uma unidade
export const useProfileTags = (branchId: string | undefined) => {
  const { data: profile } = useComplianceProfile(branchId);
  
  if (!profile) return [];
  
  return generateProfileTags(profile);
};

// Hook para obter todas as tags de todos os perfis da empresa
export const useAllProfileTags = () => {
  const { data: profiles } = useAllComplianceProfiles();
  
  if (!profiles || profiles.length === 0) return [];
  
  const allTags = new Set<string>();
  profiles.forEach(profile => {
    const tags = generateProfileTags(profile);
    tags.forEach(tag => allTags.add(tag));
  });
  
  return Array.from(allTags);
};
