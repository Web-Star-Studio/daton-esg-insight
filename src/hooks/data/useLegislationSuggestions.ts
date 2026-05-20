import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  acceptSuggestions,
  fetchLatestSuggestionRun,
  fetchSuggestionRun,
  fetchSuggestionRunHistory,
  publishSuggestionRun,
  startSuggestionRun,
} from "@/services/legislationSuggestions";

// Última run da unidade. Faz polling enquanto status='running' e também
// assina o Realtime da tabela — polling é o mecanismo confiável, o
// Realtime só deixa a atualização mais instantânea.
export function useSuggestionRun(branchId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suggestion-run", "latest", branchId],
    queryFn: () => fetchLatestSuggestionRun(branchId!),
    enabled: !!branchId,
    // Único auto-refresh: polling enquanto a run está 'running'. Com a run
    // 'completed'/'failed' a página fica 100% estável — nada recarrega
    // sozinho. Importante para apresentar ao cliente sem a tela se mexer
    // no meio da explicação (refetch on focus/reconnect desligado).
    refetchInterval: (q) => (q.state.data?.status === "running" ? 4000 : false),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!branchId) return;
    const channel = supabase
      .channel(`suggestion-runs-${branchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legislation_suggestion_runs",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["suggestion-run", "latest", branchId] });
          queryClient.invalidateQueries({ queryKey: ["suggestion-run", "history", branchId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [branchId, queryClient]);

  return query;
}

export function useSuggestionRunHistory(branchId: string | undefined) {
  return useQuery({
    queryKey: ["suggestion-run", "history", branchId],
    queryFn: () => fetchSuggestionRunHistory(branchId!),
    enabled: !!branchId,
    // Histórico não recarrega sozinho — só via ação explícita / invalidação.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Detalhe de uma run específica — usado ao abrir um item do histórico.
export function useSuggestionRunDetail(runId: string | null | undefined) {
  return useQuery({
    queryKey: ["suggestion-run", "detail", runId],
    queryFn: () => fetchSuggestionRun(runId!),
    enabled: !!runId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useStartSuggestionRun(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (opts?: { expandAi?: boolean }) => {
      if (!branchId) throw new Error("branchId ausente");
      return startSuggestionRun(branchId, opts);
    },
    onSuccess: (result) => {
      if (result.kind === "questionnaire-not-completed") {
        toast.warning("Unidade sem questionário de compliance concluído — não há tags para gerar sugestões.");
        return;
      }
      toast.success("Busca de sugestões iniciada — roda em background, pode levar 1-2 min.");
      queryClient.invalidateQueries({ queryKey: ["suggestion-run", "latest", branchId] });
      queryClient.invalidateQueries({ queryKey: ["suggestion-run", "history", branchId] });
    },
    onError: (err: Error) => {
      toast.error(`Falha ao iniciar busca: ${err.message}`);
    },
  });
}

export function usePublishSuggestionRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => publishSuggestionRun(runId),
    onSuccess: () => {
      toast.success("Sugestões publicadas — agora visíveis para toda a empresa.");
      queryClient.invalidateQueries({ queryKey: ["suggestion-run"] });
    },
    onError: (err: Error) => {
      toast.error(`Falha ao publicar: ${err.message}`);
    },
  });
}

export function useAcceptSuggestions(branchId: string | undefined) {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      payload: Array<{ legislation_id: string; applicability: "real" | "potential" | "na" | "revoked" | "pending" }>,
    ) => {
      if (!branchId) throw new Error("branchId ausente");
      if (!selectedCompany?.id) throw new Error("Empresa não resolvida");
      const count = await acceptSuggestions(branchId, selectedCompany.id, payload, user?.id);
      return count;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["legislations"] });
      queryClient.invalidateQueries({ queryKey: ["unit-compliances"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-update-letters", "branch-readiness"] });
      toast.success(`${count} legislação(ões) adicionada(s) à unidade.`);
    },
    onError: (err: Error) => {
      toast.error(`Falha ao adicionar legislações: ${err.message}`);
    },
  });
}
