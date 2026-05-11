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
    staleTime: 1000 * 60, // sugestões mudam quando o catálogo muda — 1min de cache é seguro
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
