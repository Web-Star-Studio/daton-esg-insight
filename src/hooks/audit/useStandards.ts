import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { standardsService, CreateStandardData, CreateStandardItemData } from "@/services/audit/standards";
import { useToast } from "@/hooks/use-toast";

export const standardsKeys = {
  all: ['audit-standards'] as const,
  detail: (id: string) => ['audit-standards', id] as const,
  items: (standardId: string) => ['audit-standard-items', standardId] as const,
  itemsFlat: (standardId: string) => ['audit-standard-items-flat', standardId] as const,
};

export function useStandards() {
  return useQuery({
    queryKey: standardsKeys.all,
    queryFn: () => standardsService.getStandards(),
  });
}

export function useStandard(id: string) {
  return useQuery({
    queryKey: standardsKeys.detail(id),
    queryFn: () => standardsService.getStandardById(id),
    enabled: !!id,
  });
}

export function useStandardItems(standardId: string) {
  return useQuery({
    queryKey: standardsKeys.items(standardId),
    queryFn: () => standardsService.getStandardItems(standardId),
    enabled: !!standardId,
  });
}

export function useStandardItemsFlat(standardId: string) {
  return useQuery({
    queryKey: standardsKeys.itemsFlat(standardId),
    queryFn: () => standardsService.getStandardItemsFlat(standardId),
    enabled: !!standardId,
  });
}

export function useCreateStandard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStandardData) => standardsService.createStandard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.all });
      toast({
        title: "Norma criada",
        description: "A norma foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateStandard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStandardData> }) =>
      standardsService.updateStandard(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.all });
      queryClient.invalidateQueries({ queryKey: standardsKeys.detail(id) });
      toast({
        title: "Norma atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteStandard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => standardsService.deleteStandard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.all });
      toast({
        title: "Norma excluída",
        description: "A norma foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDuplicateStandard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, newCode, newName }: { id: string; newCode: string; newName: string }) =>
      standardsService.duplicateStandard(id, newCode, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.all });
      toast({
        title: "Norma duplicada",
        description: "A norma foi duplicada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao duplicar norma",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Standard Items mutations
export function useCreateStandardItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStandardItemData) => standardsService.createStandardItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.items(variables.standard_id) });
      queryClient.invalidateQueries({ queryKey: standardsKeys.itemsFlat(variables.standard_id) });
      toast({
        title: "Item criado",
        description: "O item da norma foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateStandardItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, standardId }: { id: string; data: Partial<CreateStandardItemData>; standardId: string }) =>
      standardsService.updateStandardItem(id, data),
    onSuccess: (_, { standardId }) => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.items(standardId) });
      queryClient.invalidateQueries({ queryKey: standardsKeys.itemsFlat(standardId) });
      toast({
        title: "Item atualizado",
        description: "O item da norma foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteStandardItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, standardId }: { id: string; standardId: string }) =>
      standardsService.deleteStandardItem(id),
    onSuccess: (_, { standardId }) => {
      queryClient.invalidateQueries({ queryKey: standardsKeys.items(standardId) });
      queryClient.invalidateQueries({ queryKey: standardsKeys.itemsFlat(standardId) });
      toast({
        title: "Item excluído",
        description: "O item da norma foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
