import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as laiaService from "@/services/laiaService";
import * as laiaBranchConfigService from "@/services/laiaBranchConfigService";
import type { LAIAAssessmentFormData } from "@/types/laia";

// ============ Sectors ============

export function useLAIASectors(branchId?: string) {
  return useQuery({
    queryKey: ["laia-sectors", branchId],
    queryFn: () => laiaService.getLAIASectors(branchId),
  });
}

export function useCreateLAIASector(branchId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sector: { code: string; name: string; description?: string }) =>
      laiaService.createLAIASector({ ...sector, branch_id: branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-sectors"] });
      toast({
        title: "Setor criado",
        description: "O setor foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLAIASector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof laiaService.updateLAIASector>[1] }) =>
      laiaService.updateLAIASector(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-sectors"] });
      toast({
        title: "Setor atualizado",
        description: "O setor foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLAIASector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.deleteLAIASector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-sectors"] });
      toast({
        title: "Setor excluído",
        description: "O setor foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============ Assessments ============

export function useLAIAAssessments(filters?: Parameters<typeof laiaService.getLAIAAssessments>[0]) {
  return useQuery({
    queryKey: ["laia-assessments", filters],
    queryFn: () => laiaService.getLAIAAssessments(filters),
  });
}

// ============ Branch Stats (for unit selection page) ============

export interface LAIABranchStat {
  branch_id: string;
  total: number;
  criticos: number;
  significativos: number;
  nao_significativos: number;
}

export function useLAIABranchStats() {
  return useQuery({
    queryKey: ["laia-branch-stats"],
    queryFn: laiaService.getLAIABranchStats,
  });
}

export function useLAIAAssessment(id: string | undefined) {
  return useQuery({
    queryKey: ["laia-assessment", id],
    queryFn: () => (id ? laiaService.getLAIAAssessmentById(id) : null),
    enabled: !!id,
  });
}

export function useCreateLAIAAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.createLAIAAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      toast({
        title: "Avaliação criada",
        description: "A avaliação LAIA foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLAIAAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LAIAAssessmentFormData> }) =>
      laiaService.updateLAIAAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      toast({
        title: "Avaliação atualizada",
        description: "A avaliação LAIA foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLAIAAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.deleteLAIAAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      toast({
        title: "Avaliação excluída",
        description: "A avaliação LAIA foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============ Bulk Deletes ============

export function useBulkDeleteLAIAAssessments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.bulkDeleteLAIAAssessments,
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });
      toast({
        title: "Avaliações excluídas",
        description: `${ids.length} avaliação(ões) excluída(s) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir avaliações",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkDeleteLAIASectors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.bulkDeleteLAIASectors,
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["laia-sectors"] });
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      toast({
        title: "Setores excluídos",
        description: `${ids.length} setor(es) excluído(s) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir setores",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============ Branch Config ============

export function useLAIABranchConfigs() {
  return useQuery({
    queryKey: ["laia-branch-configs"],
    queryFn: laiaBranchConfigService.getLAIABranchConfigs,
  });
}

export function useUpsertLAIABranchConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ branchId, surveyStatus, companyId }: { branchId: string; surveyStatus: string; companyId: string }) =>
      laiaBranchConfigService.upsertLAIABranchConfig(branchId, surveyStatus as any, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-branch-configs"] });
      toast({
        title: "Status atualizado",
        description: "O status de levantamento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkUpsertLAIABranchConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ branchIds, surveyStatus, companyId }: { branchIds: string[]; surveyStatus: string; companyId: string }) =>
      laiaBranchConfigService.bulkUpsertLAIABranchConfig(branchIds, surveyStatus as any, companyId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["laia-branch-configs"] });
      toast({
        title: "Status atualizados",
        description: `${vars.branchIds.length} unidade(s) atualizada(s) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============ Dashboard Stats ============

export function useLAIADashboardStats(branchId?: string) {
  return useQuery({
    queryKey: ["laia-dashboard-stats", branchId],
    queryFn: () => laiaService.getLAIADashboardStats(branchId),
  });
}
