import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import * as laiaService from "@/services/laiaService";
import * as laiaBranchConfigService from "@/services/laiaBranchConfigService";
import type { LAIAAssessmentFormData } from "@/types/laia";

const UNDO_WINDOW_MS = 10_000;

type ToastFn = ReturnType<typeof useToast>["toast"];

function showUndoToast(args: {
  toast: ToastFn;
  title: string;
  description: string;
  onUndo: () => Promise<void>;
  doneTitle?: string;
  doneDescription?: string;
  workingTitle?: string;
  workingDescription?: string;
}) {
  const {
    toast,
    title,
    description,
    onUndo,
    doneTitle = "Ação desfeita",
    doneDescription = "Restaurado com sucesso.",
    workingTitle = "Revertendo…",
    workingDescription = "Restaurando.",
  } = args;

  let secondsLeft = Math.round(UNDO_WINDOW_MS / 1000);
  let undone = false;

  const t = toast({
    title,
    description: `${description} · Reverter em ${secondsLeft}s`,
    action: (
      <ToastAction
        altText="Desfazer"
        onClick={() => {
          if (undone) return;
          undone = true;
          clearInterval(intervalId);
          clearTimeout(dismissId);
          t.update({
            id: t.id,
            title: workingTitle,
            description: workingDescription,
            action: undefined,
          });
          onUndo()
            .then(() => {
              t.update({
                id: t.id,
                title: doneTitle,
                description: doneDescription,
                action: undefined,
              });
              setTimeout(() => t.dismiss(), 2500);
            })
            .catch((err: Error) => {
              t.update({
                id: t.id,
                title: "Erro ao desfazer",
                description: err.message,
                variant: "destructive",
                action: undefined,
              });
            });
        }}
      >
        Desfazer
      </ToastAction>
    ),
  });

  const intervalId = setInterval(() => {
    secondsLeft -= 1;
    if (undone || secondsLeft <= 0) {
      clearInterval(intervalId);
      return;
    }
    t.update({
      id: t.id,
      description: `${description} · Reverter em ${secondsLeft}s`,
    });
  }, 1000);

  const dismissId = setTimeout(() => {
    clearInterval(intervalId);
    if (!undone) t.dismiss();
  }, UNDO_WINDOW_MS);
}

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
    mutationFn: ({ id }: { id: string; label?: string }) =>
      laiaService.deleteLAIAAssessment(id),
    onSuccess: (_data, { id, label }) => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });

      const ref = label ? `“${label}”` : "Avaliação";
      showUndoToast({
        toast,
        title: `${ref} excluída`,
        description: "Movida para a Lixeira",
        doneDescription: `${ref} foi restaurada.`,
        workingDescription: `Restaurando ${ref}.`,
        onUndo: async () => {
          await laiaService.restoreLAIAAssessment(id);
          queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });
        },
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

export function useApproveLAIAAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.approveLAIAAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-assessment"] });
      toast({
        title: "Avaliação aprovada",
        description: "A avaliação foi marcada como em vigência.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkLAIAAssessmentAsPendente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; label?: string }) =>
      laiaService.markLAIAAssessmentAsPendente(id),
    onSuccess: (_data, { id, label }) => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-assessment"] });

      const ref = label ? `“${label}”` : "Avaliação";
      showUndoToast({
        toast,
        title: `${ref} marcada como pendente`,
        description: "Removida da listagem em vigência",
        doneDescription: `${ref} voltou para Em Vigência.`,
        workingDescription: `Restaurando ${ref} para Em Vigência.`,
        onUndo: async () => {
          await laiaService.approveLAIAAssessment(id);
          queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["laia-assessment"] });
        },
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar vigência",
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
      queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });

      const n = ids.length;
      const noun = n === 1 ? "avaliação" : "avaliações";
      showUndoToast({
        toast,
        title: `${n} ${noun} excluída${n === 1 ? "" : "s"}`,
        description: "Movidas para a Lixeira",
        doneDescription: `${n} ${noun} restaurada${n === 1 ? "" : "s"}.`,
        workingDescription: `Restaurando ${n} ${noun}.`,
        onUndo: async () => {
          await laiaService.bulkRestoreLAIAAssessments(ids);
          queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });
        },
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

// ============ Trash (soft-deleted assessments) ============

export function useDeletedLAIAAssessments(branchId?: string) {
  return useQuery({
    queryKey: ["laia-deleted-assessments", branchId],
    queryFn: () => laiaService.getDeletedLAIAAssessments(branchId),
  });
}

export function useRestoreLAIAAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.restoreLAIAAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });
      toast({
        title: "Avaliação restaurada",
        description: "A avaliação voltou para a listagem.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao restaurar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkRestoreLAIAAssessments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: laiaService.bulkRestoreLAIAAssessments,
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["laia-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-deleted-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["laia-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["laia-branch-stats"] });
      toast({
        title: "Avaliações restauradas",
        description: `${ids.length} avaliação(ões) restaurada(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao restaurar avaliações",
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
