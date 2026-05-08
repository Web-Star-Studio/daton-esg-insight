import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ComplianceUpdateLetter,
  GenerateLetterInput,
  fetchLettersByBranch,
  fetchLetterById,
  generateLetter,
} from "@/services/complianceUpdateLetters";

export function useComplianceUpdateLetters(branchId: string | undefined) {
  const queryClient = useQueryClient();

  const list = useQuery<ComplianceUpdateLetter[]>({
    queryKey: ["compliance-update-letters", branchId],
    queryFn: () => fetchLettersByBranch(branchId!),
    enabled: !!branchId,
  });

  const generate = useMutation({
    mutationFn: (input: GenerateLetterInput) => generateLetter(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["compliance-update-letters", branchId] });
      queryClient.setQueryData(["compliance-update-letter", result.id], result);
      toast.success("Carta gerada com sucesso");
    },
    onError: (err: Error) => {
      toast.error(`Falha ao gerar carta: ${err.message}`);
    },
  });

  return {
    letters: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    generate: generate.mutate,
    generateAsync: generate.mutateAsync,
    isGenerating: generate.isPending,
  };
}

export function useComplianceUpdateLetter(id: string | undefined) {
  return useQuery<ComplianceUpdateLetter | null>({
    queryKey: ["compliance-update-letter", id],
    queryFn: () => fetchLetterById(id!),
    enabled: !!id,
  });
}
