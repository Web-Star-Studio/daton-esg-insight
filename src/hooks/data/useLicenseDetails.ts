import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getLicenseById, getDocumentUrl } from '@/services/licenses';
import { getLicenseConditions, getLicenseAlerts, updateConditionStatus, resolveAlert } from '@/services/licenseAI';

export function useLicenseDetails(id: string | undefined) {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: license, isLoading, error, refetch } = useQuery({
    queryKey: ['license-details', id],
    queryFn: () => getLicenseById(id!),
    enabled: !!id,
  });

  const { data: conditions, isLoading: conditionsLoading, refetch: refetchConditions } = useQuery({
    queryKey: ['license-conditions', id],
    queryFn: () => getLicenseConditions(id!),
    enabled: !!id,
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['license-alerts', id],
    queryFn: () => getLicenseAlerts(id!),
    enabled: !!id,
  });

  const handleUpdateConditionStatus = useCallback(async (conditionId: string, newStatus: string) => {
    try {
      await updateConditionStatus(conditionId, newStatus);
      refetchConditions();
      toast.success('Status da condicionante atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status da condicionante');
    }
  }, [refetchConditions]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      refetchAlerts();
      toast.success('Alerta resolvido');
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  }, [refetchAlerts]);

  const handleDownloadDocument = useCallback(async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar o documento');
    }
  }, []);

  const handleViewDocument = useCallback(async (filePath: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Erro ao visualizar o documento');
    }
  }, []);

  const refetchAll = useCallback(() => {
    refetch();
    refetchConditions();
    refetchAlerts();
  }, [refetch, refetchConditions, refetchAlerts]);

  return {
    license,
    isLoading,
    error,
    conditions,
    conditionsLoading,
    alerts,
    alertsLoading,
    showUploadModal,
    setShowUploadModal,
    handleUpdateConditionStatus,
    handleResolveAlert,
    handleDownloadDocument,
    handleViewDocument,
    refetchAll,
    navigate,
  };
}
