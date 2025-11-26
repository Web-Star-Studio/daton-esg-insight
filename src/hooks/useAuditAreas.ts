import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditAreaService, CreateAuditAreaData, AuditArea } from "@/services/auditArea";
import { useToast } from "@/hooks/use-toast";

export function useAuditAreas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: areas, isLoading } = useQuery({
    queryKey: ['audit-areas'],
    queryFn: () => auditAreaService.getAreas(),
  });

  const createArea = useMutation({
    mutationFn: (data: CreateAuditAreaData) => auditAreaService.createArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-areas'] });
      toast({
        title: "Área criada",
        description: "Área auditável criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar área auditável.",
        variant: "destructive",
      });
    },
  });

  const updateArea = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AuditArea> }) =>
      auditAreaService.updateArea(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-areas'] });
      toast({
        title: "Área atualizada",
        description: "Área auditável atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar área auditável.",
        variant: "destructive",
      });
    },
  });

  const deleteArea = useMutation({
    mutationFn: (id: string) => auditAreaService.deleteArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-areas'] });
      toast({
        title: "Área excluída",
        description: "Área auditável excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir área auditável.",
        variant: "destructive",
      });
    },
  });

  return {
    areas,
    isLoading,
    createArea: createArea.mutate,
    updateArea: updateArea.mutate,
    deleteArea: deleteArea.mutate,
    isCreating: createArea.isPending,
    isUpdating: updateArea.isPending,
    isDeleting: deleteArea.isPending,
  };
}
