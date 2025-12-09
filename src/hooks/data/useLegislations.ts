import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import {
  fetchLegislations,
  fetchLegislationById,
  createLegislation,
  updateLegislation,
  deleteLegislation,
  fetchLegislationThemes,
  createLegislationTheme,
  updateLegislationTheme,
  fetchLegislationSubthemes,
  createLegislationSubtheme,
  fetchUnitCompliances,
  upsertUnitCompliance,
  fetchLegislationEvidences,
  createLegislationEvidence,
  deleteLegislationEvidence,
  fetchLegislationStats,
  Legislation,
  LegislationTheme,
  LegislationSubtheme,
  LegislationUnitCompliance,
  LegislationEvidence,
} from "@/services/legislations";

export const useLegislations = (filters?: {
  jurisdiction?: string;
  themeId?: string;
  subthemeId?: string;
  applicability?: string;
  status?: string;
  search?: string;
}) => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['legislations', currentCompany?.id, filters],
    queryFn: () => fetchLegislations(currentCompany!.id, filters),
    enabled: !!currentCompany?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Legislation>) => 
      createLegislation({ ...data, company_id: currentCompany!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislations'] });
      queryClient.invalidateQueries({ queryKey: ['legislation-stats'] });
      toast.success("Legislação cadastrada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar legislação: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Legislation> }) => 
      updateLegislation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislations'] });
      queryClient.invalidateQueries({ queryKey: ['legislation-stats'] });
      toast.success("Legislação atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar legislação: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLegislation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislations'] });
      queryClient.invalidateQueries({ queryKey: ['legislation-stats'] });
      toast.success("Legislação excluída com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir legislação: " + error.message);
    },
  });

  return {
    legislations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createLegislation: createMutation.mutate,
    updateLegislation: updateMutation.mutate,
    deleteLegislation: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useLegislation = (id: string | undefined) => {
  return useQuery({
    queryKey: ['legislation', id],
    queryFn: () => fetchLegislationById(id!),
    enabled: !!id,
  });
};

export const useLegislationThemes = () => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['legislation-themes', currentCompany?.id],
    queryFn: () => fetchLegislationThemes(currentCompany!.id),
    enabled: !!currentCompany?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<LegislationTheme>) => 
      createLegislationTheme({ ...data, company_id: currentCompany!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-themes'] });
      toast.success("Macrotema criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar macrotema: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LegislationTheme> }) => 
      updateLegislationTheme(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-themes'] });
      toast.success("Macrotema atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar macrotema: " + error.message);
    },
  });

  return {
    themes: query.data || [],
    isLoading: query.isLoading,
    createTheme: createMutation.mutate,
    updateTheme: updateMutation.mutate,
  };
};

export const useLegislationSubthemes = (themeId?: string) => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['legislation-subthemes', currentCompany?.id, themeId],
    queryFn: () => fetchLegislationSubthemes(currentCompany!.id, themeId),
    enabled: !!currentCompany?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<LegislationSubtheme>) => 
      createLegislationSubtheme({ ...data, company_id: currentCompany!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-subthemes'] });
      toast.success("Subtema criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar subtema: " + error.message);
    },
  });

  return {
    subthemes: query.data || [],
    isLoading: query.isLoading,
    createSubtheme: createMutation.mutate,
  };
};

export const useUnitCompliances = (legislationId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unit-compliances', legislationId],
    queryFn: () => fetchUnitCompliances(legislationId!),
    enabled: !!legislationId,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertUnitCompliance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-compliances', legislationId] });
      toast.success("Avaliação salva com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar avaliação: " + error.message);
    },
  });

  return {
    compliances: query.data || [],
    isLoading: query.isLoading,
    upsertCompliance: upsertMutation.mutate,
    isUpserting: upsertMutation.isPending,
  };
};

export const useLegislationEvidences = (legislationId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['legislation-evidences', legislationId],
    queryFn: () => fetchLegislationEvidences(legislationId!),
    enabled: !!legislationId,
  });

  const createMutation = useMutation({
    mutationFn: createLegislationEvidence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-evidences', legislationId] });
      toast.success("Evidência adicionada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar evidência: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLegislationEvidence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-evidences', legislationId] });
      toast.success("Evidência removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover evidência: " + error.message);
    },
  });

  return {
    evidences: query.data || [],
    isLoading: query.isLoading,
    createEvidence: createMutation.mutate,
    deleteEvidence: deleteMutation.mutate,
  };
};

export const useLegislationStats = () => {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['legislation-stats', currentCompany?.id],
    queryFn: () => fetchLegislationStats(currentCompany!.id),
    enabled: !!currentCompany?.id,
  });
};
