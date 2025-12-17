import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { responseTypesService, CreateResponseTypeData, CreateResponseOptionData } from "@/services/audit/responseTypes";
import { useToast } from "@/hooks/use-toast";

export const responseTypesKeys = {
  all: ['audit-response-types'] as const,
  detail: (id: string) => ['audit-response-types', id] as const,
  options: (typeId: string) => ['audit-response-options', typeId] as const,
};

export function useResponseTypes() {
  return useQuery({
    queryKey: responseTypesKeys.all,
    queryFn: () => responseTypesService.getResponseTypes(),
  });
}

export function useResponseTypeWithOptions(id: string) {
  return useQuery({
    queryKey: responseTypesKeys.detail(id),
    queryFn: () => responseTypesService.getResponseTypeWithOptions(id),
    enabled: !!id,
  });
}

export function useResponseOptions(responseTypeId: string) {
  return useQuery({
    queryKey: responseTypesKeys.options(responseTypeId),
    queryFn: () => responseTypesService.getResponseOptions(responseTypeId),
    enabled: !!responseTypeId,
  });
}

export function useCreateResponseType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateResponseTypeData) => responseTypesService.createResponseType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.all });
      toast({
        title: "Tipo de resposta criado",
        description: "O tipo de resposta foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar tipo de resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateResponseType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateResponseTypeData> }) =>
      responseTypesService.updateResponseType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.all });
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.detail(id) });
      toast({
        title: "Tipo de resposta atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tipo de resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteResponseType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => responseTypesService.deleteResponseType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.all });
      toast({
        title: "Tipo de resposta excluído",
        description: "O tipo de resposta foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir tipo de resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Response Options mutations
export function useCreateResponseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateResponseOptionData) => responseTypesService.createResponseOption(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.options(variables.response_type_id) });
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.detail(variables.response_type_id) });
      toast({
        title: "Opção criada",
        description: "A opção de resposta foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateResponseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, responseTypeId }: { id: string; data: Partial<CreateResponseOptionData>; responseTypeId: string }) =>
      responseTypesService.updateResponseOption(id, data),
    onSuccess: (_, { responseTypeId }) => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.options(responseTypeId) });
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.detail(responseTypeId) });
      toast({
        title: "Opção atualizada",
        description: "A opção de resposta foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteResponseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, responseTypeId }: { id: string; responseTypeId: string }) =>
      responseTypesService.deleteResponseOption(id),
    onSuccess: (_, { responseTypeId }) => {
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.options(responseTypeId) });
      queryClient.invalidateQueries({ queryKey: responseTypesKeys.detail(responseTypeId) });
      toast({
        title: "Opção excluída",
        description: "A opção de resposta foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir opção",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
