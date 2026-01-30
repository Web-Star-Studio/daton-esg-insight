import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExecutionService, ItemResponse, ItemAttachment, AuditOccurrence } from "@/services/audit/execution";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

export const executionKeys = {
  all: ['audit-execution'] as const,
  responses: (auditId: string) => [...executionKeys.all, 'responses', auditId] as const,
  sessionResponses: (sessionId: string) => [...executionKeys.all, 'session-responses', sessionId] as const,
  response: (sessionItemId: string) => [...executionKeys.all, 'response', sessionItemId] as const,
  attachments: (responseId: string) => [...executionKeys.all, 'attachments', responseId] as const,
  auditAttachments: (auditId: string) => [...executionKeys.all, 'audit-attachments', auditId] as const,
  occurrences: (auditId: string) => [...executionKeys.all, 'occurrences', auditId] as const,
  occurrence: (id: string) => [...executionKeys.all, 'occurrence', id] as const,
  stats: (auditId: string) => [...executionKeys.all, 'stats', auditId] as const,
};

// ========== RESPONSES HOOKS ==========
export function useAuditResponses(auditId: string) {
  return useQuery({
    queryKey: executionKeys.responses(auditId),
    queryFn: () => ExecutionService.getResponsesByAudit(auditId),
    enabled: !!auditId,
  });
}

export function useSessionResponses(sessionId: string) {
  return useQuery({
    queryKey: executionKeys.sessionResponses(sessionId),
    queryFn: () => ExecutionService.getResponsesBySession(sessionId),
    enabled: !!sessionId,
  });
}

export function useItemResponse(sessionItemId: string) {
  return useQuery({
    queryKey: executionKeys.response(sessionItemId),
    queryFn: () => ExecutionService.getResponseBySessionItem(sessionItemId),
    enabled: !!sessionItemId,
  });
}

export function useSaveResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (response: Omit<ItemResponse, 'id' | 'created_at' | 'updated_at'>) =>
      ExecutionService.saveResponse(response),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.responses(data.audit_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.response(data.session_item_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.stats(data.audit_id) });
      toast.success("Resposta salva com sucesso");
    },
    onError: (error) => {
      logger.error("Error saving response", error, 'audit');
      toast.error("Erro ao salvar resposta");
    },
  });
}

export function useDeleteResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, auditId }: { id: string; auditId: string }) =>
      ExecutionService.deleteResponse(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.responses(variables.auditId) });
      queryClient.invalidateQueries({ queryKey: executionKeys.stats(variables.auditId) });
      toast.success("Resposta removida");
    },
    onError: (error) => {
      logger.error("Error deleting response", error, 'audit');
      toast.error("Erro ao remover resposta");
    },
  });
}

// ========== ATTACHMENTS HOOKS ==========
export function useResponseAttachments(responseId: string) {
  return useQuery({
    queryKey: executionKeys.attachments(responseId),
    queryFn: () => ExecutionService.getAttachmentsByResponse(responseId),
    enabled: !!responseId,
  });
}

export function useAuditAttachments(auditId: string) {
  return useQuery({
    queryKey: executionKeys.auditAttachments(auditId),
    queryFn: () => ExecutionService.getAttachmentsByAudit(auditId),
    enabled: !!auditId,
  });
}

export function useAddAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachment: Omit<ItemAttachment, 'id' | 'uploaded_at'>) =>
      ExecutionService.addAttachment(attachment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.attachments(data.response_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.auditAttachments(data.audit_id) });
      toast.success("Anexo adicionado");
    },
    onError: (error) => {
      logger.error("Error adding attachment", error, 'audit');
      toast.error("Erro ao adicionar anexo");
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, responseId, auditId }: { id: string; responseId: string; auditId: string }) =>
      ExecutionService.deleteAttachment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.attachments(variables.responseId) });
      queryClient.invalidateQueries({ queryKey: executionKeys.auditAttachments(variables.auditId) });
      toast.success("Anexo removido");
    },
    onError: (error) => {
      logger.error("Error deleting attachment", error, 'audit');
      toast.error("Erro ao remover anexo");
    },
  });
}

// ========== OCCURRENCES HOOKS ==========
export function useAuditOccurrences(auditId: string) {
  return useQuery({
    queryKey: executionKeys.occurrences(auditId),
    queryFn: () => ExecutionService.getOccurrencesByAudit(auditId),
    enabled: !!auditId,
  });
}

export function useOccurrence(id: string) {
  return useQuery({
    queryKey: executionKeys.occurrence(id),
    queryFn: () => ExecutionService.getOccurrence(id),
    enabled: !!id,
  });
}

export function useCreateOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (occurrence: Omit<AuditOccurrence, 'id' | 'occurrence_number' | 'created_at' | 'updated_at'>) =>
      ExecutionService.createOccurrence(occurrence),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrences(data.audit_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.stats(data.audit_id) });
      toast.success(`Ocorrência ${data.occurrence_number} criada`);
    },
    onError: (error) => {
      logger.error("Error creating occurrence", error, 'audit');
      toast.error("Erro ao criar ocorrência");
    },
  });
}

export function useUpdateOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AuditOccurrence> }) =>
      ExecutionService.updateOccurrence(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrences(data.audit_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrence(data.id) });
      toast.success("Ocorrência atualizada");
    },
    onError: (error) => {
      logger.error("Error updating occurrence", error, 'audit');
      toast.error("Erro ao atualizar ocorrência");
    },
  });
}

export function useDeleteOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, auditId }: { id: string; auditId: string }) =>
      ExecutionService.deleteOccurrence(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrences(variables.auditId) });
      queryClient.invalidateQueries({ queryKey: executionKeys.stats(variables.auditId) });
      toast.success("Ocorrência removida");
    },
    onError: (error) => {
      logger.error("Error deleting occurrence", error, 'audit');
      toast.error("Erro ao remover ocorrência");
    },
  });
}

export function useCloseOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, closedBy }: { id: string; closedBy: string }) =>
      ExecutionService.closeOccurrence(id, closedBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrences(data.audit_id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.occurrence(data.id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.stats(data.audit_id) });
      toast.success("Ocorrência fechada");
    },
    onError: (error) => {
      logger.error("Error closing occurrence", error, 'audit');
      toast.error("Erro ao fechar ocorrência");
    },
  });
}

// ========== STATS HOOKS ==========
export function useExecutionStats(auditId: string) {
  return useQuery({
    queryKey: executionKeys.stats(auditId),
    queryFn: () => ExecutionService.getExecutionStats(auditId),
    enabled: !!auditId,
  });
}
