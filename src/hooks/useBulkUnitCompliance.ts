import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bulkUpsertUnitCompliance } from "@/services/legislations";
import { BulkComplianceData } from "@/components/legislation/BulkComplianceModal";

interface BulkUpsertParams {
  legislationId: string;
  branchIds: string[];
  companyId: string;
  data: BulkComplianceData;
  evaluatedBy?: string;
}

export const useBulkUnitCompliance = (legislationId: string | undefined) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ legislationId, branchIds, companyId, data, evaluatedBy }: BulkUpsertParams) => {
      return bulkUpsertUnitCompliance(legislationId, branchIds, companyId, data, evaluatedBy);
    },
    onSuccess: (result, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['unit-compliances', legislationId] });
      queryClient.invalidateQueries({ queryKey: ['legislation', legislationId] });
      queryClient.invalidateQueries({ queryKey: ['legislations'] });
      
      toast.success(`${variables.branchIds.length} unidade(s) atualizada(s) com sucesso`);
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar unidades: " + error.message);
    },
  });

  const bulkUpsert = (
    branchIds: string[],
    companyId: string,
    data: BulkComplianceData,
    evaluatedBy?: string,
    options?: { onSuccess?: () => void }
  ) => {
    if (!legislationId) return;
    
    mutation.mutate(
      { legislationId, branchIds, companyId, data, evaluatedBy },
      { onSuccess: options?.onSuccess }
    );
  };

  return {
    bulkUpsert,
    isBulkUpserting: mutation.isPending,
  };
};
