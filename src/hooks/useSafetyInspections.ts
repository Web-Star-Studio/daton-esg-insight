import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSafetyInspections,
  getSafetyInspectionMetrics,
  createSafetyInspection,
  updateSafetyInspection,
  deleteSafetyInspection,
  SafetyInspection,
} from '@/services/safetyInspections';
import { toast } from 'sonner';

export const useSafetyInspections = () => {
  return useQuery({
    queryKey: ['safety-inspections'],
    queryFn: getSafetyInspections,
  });
};

export const useSafetyInspectionMetrics = () => {
  return useQuery({
    queryKey: ['safety-inspection-metrics'],
    queryFn: getSafetyInspectionMetrics,
  });
};

export const useCreateSafetyInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inspection: Omit<SafetyInspection, 'id' | 'created_at' | 'updated_at'>) =>
      createSafetyInspection(inspection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['safety-inspection-metrics'] });
      toast.success('Inspeção registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar inspeção');
    },
  });
};

export const useUpdateSafetyInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SafetyInspection> }) =>
      updateSafetyInspection(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['safety-inspection-metrics'] });
      toast.success('Inspeção atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar inspeção');
    },
  });
};

export const useDeleteSafetyInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSafetyInspection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['safety-inspection-metrics'] });
      toast.success('Inspeção excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir inspeção');
    },
  });
};
