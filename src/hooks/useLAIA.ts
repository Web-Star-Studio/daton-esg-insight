import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as laiaService from "@/services/laiaService";
import type { LAIAAssessmentFormData } from "@/types/laia";

// ============ Sectors ============

export function useLAIASectors() {
  return useQuery({
    queryKey: ["laia-sectors"],
    queryFn: laiaService.getLAIASectors,
  });
}

export function useCreateLAIASector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.createLAIASector,
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

// ============ Dashboard Stats ============

export function useLAIADashboardStats() {
  return useQuery({
    queryKey: ["laia-dashboard-stats"],
    queryFn: laiaService.getLAIADashboardStats,
  });
}
