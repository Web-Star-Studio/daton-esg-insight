import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesService, CreateTemplateData, CreateTemplatePlanningData } from "@/services/audit/templates";
import { useToast } from "@/hooks/use-toast";

export const templatesKeys = {
  all: ['audit-templates'] as const,
  detail: (id: string) => ['audit-templates', id] as const,
  standards: (templateId: string) => ['audit-template-standards', templateId] as const,
  plannings: (templateId: string) => ['audit-template-plannings', templateId] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: templatesKeys.all,
    queryFn: () => templatesService.getTemplates(),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesService.getTemplateById(id),
    enabled: !!id,
  });
}

export function useTemplateWithDetails(id: string) {
  return useQuery({
    queryKey: [...templatesKeys.detail(id), 'details'],
    queryFn: () => templatesService.getTemplateWithDetails(id),
    enabled: !!id,
  });
}

export function useTemplateStandards(templateId: string) {
  return useQuery({
    queryKey: templatesKeys.standards(templateId),
    queryFn: () => templatesService.getTemplateStandards(templateId),
    enabled: !!templateId,
  });
}

export function useTemplatePlannings(templateId: string) {
  return useQuery({
    queryKey: templatesKeys.plannings(templateId),
    queryFn: () => templatesService.getTemplatePlannings(templateId),
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTemplateData) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all });
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) =>
      templatesService.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all });
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(id) });
      toast({
        title: "Template atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => templatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all });
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Template Standards mutations
export function useAddStandardToTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateId, standardId }: { templateId: string; standardId: string }) =>
      templatesService.addStandardToTemplate(templateId, standardId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.standards(templateId) });
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(templateId) });
      toast({
        title: "Norma adicionada",
        description: "A norma foi vinculada ao template.",
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

export function useRemoveStandardFromTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateId, standardId }: { templateId: string; standardId: string }) =>
      templatesService.removeStandardFromTemplate(templateId, standardId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.standards(templateId) });
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(templateId) });
      toast({
        title: "Norma removida",
        description: "A norma foi desvinculada do template.",
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

// Template Plannings mutations
export function useCreateTemplatePlanning() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTemplatePlanningData) => templatesService.createPlanning(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.plannings(variables.template_id) });
      toast({
        title: "Planejamento criado",
        description: "O planejamento foi adicionado ao template.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar planejamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTemplatePlanning() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, templateId }: { id: string; templateId: string }) =>
      templatesService.deletePlanning(id),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.plannings(templateId) });
      toast({
        title: "Planejamento excluído",
        description: "O planejamento foi removido do template.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir planejamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
