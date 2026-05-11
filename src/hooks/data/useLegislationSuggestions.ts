import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  SuggestionsResponse,
  acceptSuggestions,
  fetchSuggestions,
} from "@/services/legislationSuggestions";

export function useLegislationSuggestions(branchId: string | undefined, expandAi: boolean = false) {
  return useQuery<SuggestionsResponse | null>({
    queryKey: ["legislation-suggestions", branchId, expandAi],
    queryFn: () => fetchSuggestions(branchId!, { expandAi }),
    enabled: !!branchId,
    // Cada chamada custa ~$0.10 e leva 70-90s. Defaults do React Query
    // (refetchOnWindowFocus=true, staleTime=0) disparavam refetch toda vez
    // que o usuário voltava pra aba — visto em prod: 10 runs em 27min.
    // Suggestions só precisa rebuscar via ação explícita (botão "Refazer
    // busca IA"), então fixamos cache "estável até trocar query key".
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ["legislation-suggestions", branchId] });
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
