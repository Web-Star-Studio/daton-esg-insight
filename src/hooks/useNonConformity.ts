import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  nonConformityService, 
  NonConformity, 
  NCImmediateAction, 
  NCCauseAnalysis, 
  NCActionPlan, 
  NCEffectiveness, 
  NCTask 
} from "@/services/nonConformityService";
import { toast } from "sonner";

// ==================== NON-CONFORMITIES ====================

export function useNonConformities() {
  return useQuery({
    queryKey: ["non-conformities"],
    queryFn: () => nonConformityService.getNonConformities(),
    staleTime: 30 * 1000,
  });
}

export function useNonConformity(id: string) {
  return useQuery({
    queryKey: ["non-conformity", id],
    queryFn: () => nonConformityService.getNonConformity(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateNonConformity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NonConformity> }) =>
      nonConformityService.updateNonConformity(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
      queryClient.invalidateQueries({ queryKey: ["non-conformity", data.id] });
      toast.success("Não conformidade atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar não conformidade");
    },
  });
}

export function useAdvanceNCStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, currentStage }: { id: string; currentStage: number }) =>
      nonConformityService.advanceStage(id, currentStage),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
      queryClient.invalidateQueries({ queryKey: ["non-conformity", data.id] });
      toast.success(`Avançado para etapa ${data.current_stage}!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao avançar etapa");
    },
  });
}

// ==================== IMMEDIATE ACTIONS (Etapa 2) ====================

export function useImmediateActions(ncId: string) {
  return useQuery({
    queryKey: ["nc-immediate-actions", ncId],
    queryFn: () => nonConformityService.getImmediateActions(ncId),
    enabled: !!ncId,
  });
}

export function useCreateImmediateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (action: Omit<NCImmediateAction, 'id' | 'created_at' | 'updated_at'>) =>
      nonConformityService.createImmediateAction(action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nc-immediate-actions", data.non_conformity_id] });
      toast.success("Ação imediata registrada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar ação imediata");
    },
  });
}

export function useUpdateImmediateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NCImmediateAction> }) =>
      nonConformityService.updateImmediateAction(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nc-immediate-actions"] });
      toast.success("Ação imediata atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar ação imediata");
    },
  });
}

export function useDeleteImmediateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => nonConformityService.deleteImmediateAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-immediate-actions"] });
      toast.success("Ação imediata removida!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover ação imediata");
    },
  });
}

// ==================== CAUSE ANALYSIS (Etapa 3) ====================

export function useCauseAnalysis(ncId: string) {
  return useQuery({
    queryKey: ["nc-cause-analysis", ncId],
    queryFn: () => nonConformityService.getCauseAnalysis(ncId),
    enabled: !!ncId,
  });
}

export function useCreateCauseAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (analysis: Omit<NCCauseAnalysis, 'id' | 'created_at' | 'updated_at'>) =>
      nonConformityService.createCauseAnalysis(analysis),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nc-cause-analysis", data.non_conformity_id] });
      toast.success("Análise de causa registrada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar análise de causa");
    },
  });
}

export function useUpdateCauseAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NCCauseAnalysis> }) =>
      nonConformityService.updateCauseAnalysis(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-cause-analysis"] });
      toast.success("Análise de causa atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar análise de causa");
    },
  });
}

// ==================== ACTION PLANS (Etapa 4) ====================

export function useActionPlans(ncId: string) {
  return useQuery({
    queryKey: ["nc-action-plans", ncId],
    queryFn: () => nonConformityService.getActionPlans(ncId),
    enabled: !!ncId,
  });
}

export function useCreateActionPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (plan: Omit<NCActionPlan, 'id' | 'created_at' | 'updated_at'>) =>
      nonConformityService.createActionPlan(plan),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nc-action-plans", data.non_conformity_id] });
      toast.success("Ação planejada registrada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar ação");
    },
  });
}

export function useUpdateActionPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NCActionPlan> }) =>
      nonConformityService.updateActionPlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-action-plans"] });
      toast.success("Ação atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar ação");
    },
  });
}

export function useDeleteActionPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => nonConformityService.deleteActionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-action-plans"] });
      toast.success("Ação removida!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover ação");
    },
  });
}

// ==================== EFFECTIVENESS (Etapa 6) ====================

export function useEffectiveness(ncId: string) {
  return useQuery({
    queryKey: ["nc-effectiveness", ncId],
    queryFn: () => nonConformityService.getEffectiveness(ncId),
    enabled: !!ncId,
  });
}

export function useCreateEffectiveness() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (effectiveness: Omit<NCEffectiveness, 'id' | 'created_at' | 'updated_at'>) =>
      nonConformityService.createEffectiveness(effectiveness),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nc-effectiveness", data.non_conformity_id] });
      queryClient.invalidateQueries({ queryKey: ["non-conformity", data.non_conformity_id] });
      toast.success("Avaliação de eficácia registrada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar avaliação");
    },
  });
}

export function useUpdateEffectiveness() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NCEffectiveness> }) =>
      nonConformityService.updateEffectiveness(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-effectiveness"] });
      toast.success("Avaliação atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar avaliação");
    },
  });
}

// ==================== TASKS ====================

export function useNCTasks(filters?: {
  responsible_user_id?: string;
  task_type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["nc-tasks", filters],
    queryFn: () => nonConformityService.getTasks(filters),
  });
}

export function useMyNCTasks() {
  return useQuery({
    queryKey: ["nc-my-tasks"],
    queryFn: () => nonConformityService.getMyTasks(),
  });
}

export function useCreateNCTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (task: Omit<NCTask, 'id' | 'created_at' | 'updated_at'>) =>
      nonConformityService.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["nc-my-tasks"] });
      toast.success("Tarefa criada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar tarefa");
    },
  });
}

export function useUpdateNCTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NCTask> }) =>
      nonConformityService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["nc-my-tasks"] });
      toast.success("Tarefa atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar tarefa");
    },
  });
}

export function useCompleteNCTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => nonConformityService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nc-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["nc-my-tasks"] });
      toast.success("Tarefa concluída!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao concluir tarefa");
    },
  });
}

// ==================== DASHBOARD STATS ====================

export function useNCDashboardStats() {
  return useQuery({
    queryKey: ["nc-dashboard-stats"],
    queryFn: () => nonConformityService.getDashboardStats(),
    staleTime: 60 * 1000,
  });
}

// ==================== COMPANY USERS ====================

export function useCompanyUsers() {
  return useQuery({
    queryKey: ["company-users"],
    queryFn: () => nonConformityService.getCompanyUsers(),
    staleTime: 5 * 60 * 1000,
  });
}
