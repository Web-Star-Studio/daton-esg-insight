import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditProgramService, CreateAuditProgramData, AuditProgram } from "@/services/auditProgram";
import { useToast } from "@/hooks/use-toast";

export function useAuditProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['audit-programs'],
    queryFn: () => auditProgramService.getPrograms(),
  });

  const createProgram = useMutation({
    mutationFn: (data: CreateAuditProgramData) => auditProgramService.createProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-programs'] });
      toast({
        title: "Programa criado",
        description: "Programa de auditoria criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar programa de auditoria.",
        variant: "destructive",
      });
    },
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AuditProgram> }) =>
      auditProgramService.updateProgram(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-programs'] });
      toast({
        title: "Programa atualizado",
        description: "Programa de auditoria atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar programa de auditoria.",
        variant: "destructive",
      });
    },
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => auditProgramService.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-programs'] });
      toast({
        title: "Programa excluído",
        description: "Programa de auditoria excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir programa de auditoria.",
        variant: "destructive",
      });
    },
  });

  const approveProgram = useMutation({
    mutationFn: (id: string) => auditProgramService.approveProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-programs'] });
      toast({
        title: "Programa aprovado",
        description: "Programa de auditoria aprovado e iniciado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao aprovar programa de auditoria.",
        variant: "destructive",
      });
    },
  });

  return {
    programs,
    isLoading,
    createProgram: createProgram.mutate,
    updateProgram: updateProgram.mutate,
    deleteProgram: deleteProgram.mutate,
    approveProgram: approveProgram.mutate,
    isCreating: createProgram.isPending,
    isUpdating: updateProgram.isPending,
    isDeleting: deleteProgram.isPending,
  };
}
