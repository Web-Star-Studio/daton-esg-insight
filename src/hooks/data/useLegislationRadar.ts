import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  AcceptableNovelty,
  RadarResponse,
  acceptRadarNovelties,
  fetchMonthlyRadar,
} from "@/services/legislationRadar";

// useMonthlyRadar é "manual" por padrão (`enabled=false`) porque a chamada é
// cara — Sonar com web search consome ~2-5s por execução. O usuário dispara
// via refetch() ao clicar "Buscar novidades".
export function useMonthlyRadar(
  branchId: string | undefined,
  referenceMonth: string | undefined,
  opts?: { enabled?: boolean },
) {
  return useQuery<RadarResponse>({
    queryKey: ["legislation-radar", branchId, referenceMonth],
    queryFn: () => fetchMonthlyRadar(branchId!, referenceMonth!),
    enabled: !!branchId && !!referenceMonth && (opts?.enabled ?? false),
    // Radar é compute-on-demand caro — mantém em cache por 5 min para o
    // usuário não reexecutar acidentalmente ao trocar tab/voltar.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAcceptRadarNovelties(branchId: string | undefined) {
  const queryClient = useQueryClient();
  const { selectedCompany } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (novelties: AcceptableNovelty[]) => {
      if (!branchId) throw new Error("branchId ausente");
      if (!selectedCompany?.id) throw new Error("Empresa não resolvida");
      return acceptRadarNovelties(branchId, selectedCompany.id, novelties, user?.id);
    },
    onSuccess: (result) => {
      // Invalida queries afetadas: o radar (cache do mês), o catálogo (ganhou
      // legislações novas), as cartas (próxima geração vai mostrar elas em
      // "Publicadas") e o readiness (legCount cresceu).
      queryClient.invalidateQueries({ queryKey: ["legislation-radar", branchId] });
      queryClient.invalidateQueries({ queryKey: ["legislation-suggestions", branchId] });
      queryClient.invalidateQueries({ queryKey: ["legislations"] });
      queryClient.invalidateQueries({ queryKey: ["unit-compliances"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-update-letters"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-update-letters", "branch-readiness"] });
      toast.success(
        `${result.legislationsCreated} novidade(s) adicionada(s) ao catálogo, ${result.complianceLinks} vinculada(s) à unidade. Gere a carta deste mês para ver no relatório.`,
      );
    },
    onError: (err: Error) => {
      toast.error(`Falha ao aceitar novidades: ${err.message}`);
    },
  });
}
