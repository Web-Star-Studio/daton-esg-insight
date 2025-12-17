import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  planningService, 
  CreateSessionData, 
  CreateParticipantData,
  PlanningStatus 
} from "@/services/audit/planning";
import { useToast } from "@/hooks/use-toast";

export const planningKeys = {
  all: ['audit-planning'] as const,
  audit: (auditId: string) => ['audit-planning', auditId] as const,
  sessions: (auditId: string) => ['audit-sessions', auditId] as const,
  session: (sessionId: string) => ['audit-session', sessionId] as const,
  standards: (auditId: string) => ['audit-standards-link', auditId] as const,
  items: (sessionId: string) => ['session-items', sessionId] as const,
};

export function useAuditPlanning(auditId: string) {
  return useQuery({
    queryKey: planningKeys.audit(auditId),
    queryFn: () => planningService.getAuditWithPlanning(auditId),
    enabled: !!auditId,
  });
}

export function useAuditSessions(auditId: string) {
  return useQuery({
    queryKey: planningKeys.sessions(auditId),
    queryFn: () => planningService.getSessions(auditId),
    enabled: !!auditId,
  });
}

export function useSessionDetails(sessionId: string) {
  return useQuery({
    queryKey: planningKeys.session(sessionId),
    queryFn: () => planningService.getSessionWithDetails(sessionId),
    enabled: !!sessionId,
  });
}

export function useAuditStandardsLink(auditId: string) {
  return useQuery({
    queryKey: planningKeys.standards(auditId),
    queryFn: () => planningService.getAuditStandards(auditId),
    enabled: !!auditId,
  });
}

export function useSessionItems(sessionId: string) {
  return useQuery({
    queryKey: planningKeys.items(sessionId),
    queryFn: () => planningService.getSessionItems(sessionId),
    enabled: !!sessionId,
  });
}

// Mutations
export function useCreateSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSessionData) => planningService.createSession(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.sessions(variables.audit_id) });
      queryClient.invalidateQueries({ queryKey: planningKeys.audit(variables.audit_id) });
      toast({
        title: "Sessão criada",
        description: "A sessão foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, auditId }: { id: string; data: Partial<CreateSessionData>; auditId: string }) =>
      planningService.updateSession(id, data),
    onSuccess: (_, { auditId, id }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.sessions(auditId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.session(id) });
      toast({
        title: "Sessão atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, auditId }: { id: string; auditId: string }) =>
      planningService.deleteSession(id),
    onSuccess: (_, { auditId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.sessions(auditId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.audit(auditId) });
      toast({
        title: "Sessão excluída",
        description: "A sessão foi removida.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateParticipantData) => planningService.addParticipant(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.session(variables.session_id) });
      toast({
        title: "Participante adicionado",
        description: "O participante foi adicionado à sessão.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar participante",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId: string }) =>
      planningService.removeParticipant(id),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.session(sessionId) });
      toast({
        title: "Participante removido",
        description: "O participante foi removido da sessão.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover participante",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddStandardToAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ auditId, standardId }: { auditId: string; standardId: string }) =>
      planningService.addStandardToAudit(auditId, standardId),
    onSuccess: (_, { auditId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.standards(auditId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.audit(auditId) });
      toast({
        title: "Norma adicionada",
        description: "A norma foi vinculada à auditoria.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveStandardFromAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ auditId, standardId }: { auditId: string; standardId: string }) =>
      planningService.removeStandardFromAudit(auditId, standardId),
    onSuccess: (_, { auditId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.standards(auditId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.audit(auditId) });
      toast({
        title: "Norma removida",
        description: "A norma foi desvinculada da auditoria.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddItemsToSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ sessionId, itemIds, linkId }: { sessionId: string; itemIds: string[]; linkId?: string }) =>
      planningService.addItemsToSession(sessionId, itemIds, linkId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.items(sessionId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.session(sessionId) });
      toast({
        title: "Itens adicionados",
        description: "Os itens foram adicionados à sessão.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar itens",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useClearSessionItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => planningService.clearSessionItems(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.items(sessionId) });
      queryClient.invalidateQueries({ queryKey: planningKeys.session(sessionId) });
    },
  });
}

export function useFinalizePlanning() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (auditId: string) => planningService.finalizePlanning(auditId),
    onSuccess: (result, auditId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: planningKeys.audit(auditId) });
        queryClient.invalidateQueries({ queryKey: ['audits'] });
        toast({
          title: "Planejamento finalizado",
          description: `O planejamento foi bloqueado com ${result.total_items} itens.`,
        });
      } else {
        toast({
          title: "Erro ao finalizar",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao finalizar planejamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePlanningStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ auditId, status }: { auditId: string; status: PlanningStatus }) =>
      planningService.updatePlanningStatus(auditId, status),
    onSuccess: (_, { auditId }) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.audit(auditId) });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
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
