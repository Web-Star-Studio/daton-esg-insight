import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getIntegratedReports, 
  getIntegratedReport, 
  createIntegratedReport, 
  updateIntegratedReport, 
  deleteIntegratedReport,
  publishReport,
  type IntegratedReport 
} from '@/services/integratedReports';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useIntegratedReport(reportId?: string) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Get current user
  supabase.auth.getUser().then(({ data }) => {
    setCurrentUser(data.user?.id || null);
  });

  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['integrated-reports'],
    queryFn: getIntegratedReports,
  });

  // Fetch single report
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ['integrated-report', reportId],
    queryFn: () => reportId ? getIntegratedReport(reportId) : null,
    enabled: !!reportId,
  });

  // Create report mutation
  const createMutation = useMutation({
    mutationFn: createIntegratedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrated-reports'] });
      toast.success('Relatório criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar relatório: ${error.message}`);
    },
  });

  // Update report mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IntegratedReport> }) =>
      updateIntegratedReport(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrated-reports'] });
      queryClient.invalidateQueries({ queryKey: ['integrated-report', reportId] });
      toast.success('Relatório atualizado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: deleteIntegratedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrated-reports'] });
      toast.success('Relatório excluído!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  // Publish report mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      publishReport(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrated-reports'] });
      queryClient.invalidateQueries({ queryKey: ['integrated-report', reportId] });
      toast.success('Relatório publicado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao publicar: ${error.message}`);
    },
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateIntegratedReport(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrated-reports'] });
      queryClient.invalidateQueries({ queryKey: ['integrated-report', reportId] });
      toast.success(`Status alterado para: ${data.status}`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  return {
    reports,
    report,
    isLoading: isLoadingReports || isLoadingReport,
    createReport: createMutation.mutate,
    updateReport: updateMutation.mutate,
    deleteReport: deleteMutation.mutate,
    publishReport: publishMutation.mutate,
    changeStatus: changeStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPublishing: publishMutation.isPending,
    currentUser,
  };
}
