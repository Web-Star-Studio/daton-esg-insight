import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSafetyIncidents, getSafetyMetrics, createSafetyIncident, updateSafetyIncident, deleteSafetyIncident, SafetyIncident } from '@/services/safetyIncidents';
import { toast } from 'sonner';

export const useSafetyIncidents = () => {
  return useQuery({
    queryKey: ['safety-incidents'],
    queryFn: getSafetyIncidents,
  });
};

export const useSafetyMetrics = () => {
  return useQuery({
    queryKey: ['safety-metrics'],
    queryFn: getSafetyMetrics,
  });
};

export const useCreateSafetyIncident = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (incident: Omit<SafetyIncident, 'id' | 'created_at' | 'updated_at'>) => 
      createSafetyIncident(incident),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['safety-metrics'] });
      toast.success('Incidente registrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar incidente');
    },
  });
};

export const useUpdateSafetyIncident = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SafetyIncident> }) => 
      updateSafetyIncident(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['safety-metrics'] });
      toast.success('Incidente atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar incidente');
    },
  });
};

export const useDeleteSafetyIncident = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSafetyIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['safety-metrics'] });
      toast.success('Incidente excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir incidente');
    },
  });
};