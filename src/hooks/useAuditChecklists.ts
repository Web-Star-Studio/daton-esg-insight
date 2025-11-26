import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditChecklistService, AuditChecklist, ChecklistResponse, ISOStandard } from "@/services/auditChecklist";
import { useToast } from "@/hooks/use-toast";

export function useAuditChecklists() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['audit-checklists'],
    queryFn: () => auditChecklistService.getChecklists(),
  });

  const { data: templates } = useQuery({
    queryKey: ['audit-checklist-templates'],
    queryFn: () => auditChecklistService.getTemplates(),
  });

  const getChecklistsByStandard = (standard: ISOStandard) => useQuery({
    queryKey: ['audit-checklists', standard],
    queryFn: () => auditChecklistService.getChecklistsByStandard(standard),
  });

  const getResponsesByAudit = (auditId: string) => useQuery({
    queryKey: ['audit-responses', auditId],
    queryFn: () => auditChecklistService.getResponsesByAudit(auditId),
    enabled: !!auditId,
  });

  const createChecklist = useMutation({
    mutationFn: (data: Omit<AuditChecklist, 'id' | 'company_id' | 'created_at' | 'updated_at'>) =>
      auditChecklistService.createChecklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-checklists'] });
      toast({
        title: "Checklist criado",
        description: "Checklist de auditoria criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar checklist.",
        variant: "destructive",
      });
    },
  });

  const createResponse = useMutation({
    mutationFn: (data: Omit<ChecklistResponse, 'id' | 'created_at' | 'updated_at'>) =>
      auditChecklistService.createResponse(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audit-responses', variables.audit_id] });
      toast({
        title: "Resposta registrada",
        description: "Resposta do checklist registrada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar resposta.",
        variant: "destructive",
      });
    },
  });

  const updateResponse = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ChecklistResponse> }) =>
      auditChecklistService.updateResponse(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-responses'] });
      toast({
        title: "Resposta atualizada",
        description: "Resposta do checklist atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar resposta.",
        variant: "destructive",
      });
    },
  });

  return {
    checklists,
    templates,
    isLoading,
    getChecklistsByStandard,
    getResponsesByAudit,
    createChecklist: createChecklist.mutate,
    createResponse: createResponse.mutate,
    updateResponse: updateResponse.mutate,
    isCreatingChecklist: createChecklist.isPending,
    isCreatingResponse: createResponse.isPending,
  };
}
