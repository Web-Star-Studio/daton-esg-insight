import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as revisionService from "@/services/laiaRevisionService";

export function useLAIARevisions() {
  return useQuery({
    queryKey: ["laia-revisions"],
    queryFn: () => revisionService.getRevisions(),
  });
}

export function useLAIARevision(id: string | undefined) {
  return useQuery({
    queryKey: ["laia-revision", id],
    queryFn: () => (id ? revisionService.getRevisionById(id) : null),
    enabled: !!id,
  });
}

export function useLAIAPendingChangesCount() {
  return useQuery({
    queryKey: ["laia-pending-changes-count"],
    queryFn: revisionService.getPendingChangesCount,
  });
}

export function useGetOrCreateDraftRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revisionService.getOrCreateDraftRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["laia-pending-changes-count"] });
    },
  });
}

export function useAddChangesToRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ revisionId, changes }: { revisionId: string; changes: revisionService.ChangeInput[] }) =>
      revisionService.addChangesToRevision(revisionId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["laia-pending-changes-count"] });
    },
  });
}

export function useValidateRevision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: revisionService.validateRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      toast({ title: "Revisão validada", description: "A revisão foi validada com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao validar revisão", description: error.message, variant: "destructive" });
    },
  });
}

export function useFinalizeRevision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description?: string }) =>
      revisionService.finalizeRevision(id, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["laia-pending-changes-count"] });
      toast({ title: "Revisão finalizada", description: "A revisão foi salva no histórico." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao finalizar revisão", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateRevisionTitle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description?: string }) =>
      revisionService.updateRevisionTitle(id, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      toast({ title: "Título atualizado" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar título", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRevision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: revisionService.deleteRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laia-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["laia-pending-changes-count"] });
      toast({ title: "Revisão descartada" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao descartar revisão", description: error.message, variant: "destructive" });
    },
  });
}
