/**
 * Hooks para Scoring de Auditorias
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScoringService, ScoringConfig, GradeConfig, GradeLevel } from "@/services/audit/scoring";
import { useToast } from "@/hooks/use-toast";

export const scoringKeys = {
  all: ['audit-scoring'] as const,
  config: (auditId: string) => [...scoringKeys.all, 'config', auditId] as const,
  result: (auditId: string) => [...scoringKeys.all, 'result', auditId] as const,
  gradeConfigs: (companyId: string) => [...scoringKeys.all, 'grades', companyId] as const,
};

// Scoring Config
export function useScoringConfig(auditId: string) {
  return useQuery({
    queryKey: scoringKeys.config(auditId),
    queryFn: () => ScoringService.getScoringConfig(auditId),
    enabled: !!auditId,
  });
}

export function useUpdateScoringConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      auditId, 
      companyId, 
      config 
    }: { 
      auditId: string; 
      companyId: string; 
      config: Partial<ScoringConfig> 
    }) => ScoringService.createOrUpdateScoringConfig(auditId, companyId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.config(variables.auditId) });
      toast({ title: "Configuração de pontuação salva" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    },
  });
}

// Scoring Results
export function useScoringResult(auditId: string) {
  return useQuery({
    queryKey: scoringKeys.result(auditId),
    queryFn: () => ScoringService.getScoringResult(auditId),
    enabled: !!auditId,
  });
}

export function useCalculateScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (auditId: string) => ScoringService.calculateScore(auditId),
    onSuccess: (_, auditId) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.result(auditId) });
      toast({ title: "Pontuação calculada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao calcular pontuação", variant: "destructive" });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      auditId, 
      grade, 
      status 
    }: { 
      auditId: string; 
      grade: string; 
      status: string 
    }) => ScoringService.updateGrade(auditId, grade, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.result(variables.auditId) });
      toast({ title: "Classificação atualizada" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar classificação", variant: "destructive" });
    },
  });
}

// Grade Configs
export function useGradeConfigs(companyId: string) {
  return useQuery({
    queryKey: scoringKeys.gradeConfigs(companyId),
    queryFn: () => ScoringService.getGradeConfigs(companyId),
    enabled: !!companyId,
  });
}

export function useCreateGradeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      companyId, 
      config 
    }: { 
      companyId: string; 
      config: Omit<GradeConfig, 'id' | 'company_id' | 'created_at' | 'updated_at'> 
    }) => ScoringService.createGradeConfig(companyId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.gradeConfigs(variables.companyId) });
      toast({ title: "Configuração de notas criada" });
    },
    onError: () => {
      toast({ title: "Erro ao criar configuração", variant: "destructive" });
    },
  });
}

export function useUpdateGradeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      id, 
      companyId,
      config 
    }: { 
      id: string; 
      companyId: string;
      config: Partial<GradeConfig> 
    }) => ScoringService.updateGradeConfig(id, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.gradeConfigs(variables.companyId) });
      toast({ title: "Configuração atualizada" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar configuração", variant: "destructive" });
    },
  });
}

export function useDeleteGradeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) => 
      ScoringService.deleteGradeConfig(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scoringKeys.gradeConfigs(variables.companyId) });
      toast({ title: "Configuração removida" });
    },
    onError: () => {
      toast({ title: "Erro ao remover configuração", variant: "destructive" });
    },
  });
}

// Utility hooks
export function useGradeFromPercentage(percentage: number, grades?: GradeLevel[]) {
  const gradesList = grades || ScoringService.getDefaultGrades();
  return ScoringService.determineGrade(percentage, gradesList);
}
