import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProcessMaps, createProcessMap } from '@/services/processMapping';

interface NewProcessData {
  name: string;
  description: string;
  process_type: string;
}

export function useProcessMapping() {
  const queryClient = useQueryClient();
  const [isCreateProcessOpen, setIsCreateProcessOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [newProcessData, setNewProcessData] = useState<NewProcessData>({
    name: '',
    description: '',
    process_type: 'Operacional',
  });

  const { data: processMaps, isLoading } = useQuery({
    queryKey: ['processMaps'],
    queryFn: getProcessMaps,
  });

  const createProcessMutation = useMutation({
    mutationFn: async (processData: NewProcessData) => {
      return createProcessMap({
        name: processData.name,
        description: processData.description,
        process_type: processData.process_type,
        status: 'Draft',
        version: '1.0',
        canvas_data: {},
        is_current_version: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processMaps'] });
      setIsCreateProcessOpen(false);
      setNewProcessData({
        name: '',
        description: '',
        process_type: 'Operacional',
      });
      toast.success('Mapa de processo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar mapa de processo: ${error.message}`);
    },
  });

  const handleCreateProcess = useCallback(() => {
    if (!newProcessData.name.trim()) {
      toast.error('Nome do processo é obrigatório');
      return;
    }
    createProcessMutation.mutate(newProcessData);
  }, [newProcessData, createProcessMutation]);

  const getProcessTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'Estratégico': return 'default';
      case 'Operacional': return 'secondary';
      case 'Apoio': return 'outline';
      default: return 'outline';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Review': return 'destructive';
      case 'Approved': return 'default';
      case 'Archived': return 'outline';
      default: return 'outline';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    const iconMap: Record<string, string> = {
      'Draft': 'Edit',
      'Review': 'Clock',
      'Approved': 'CheckCircle',
      'Archived': 'AlertCircle',
    };
    return iconMap[status] || 'Edit';
  }, []);

  return {
    processMaps,
    isLoading,
    isCreateProcessOpen,
    setIsCreateProcessOpen,
    selectedProcessId,
    setSelectedProcessId,
    newProcessData,
    setNewProcessData,
    handleCreateProcess,
    createProcessMutation,
    getProcessTypeColor,
    getStatusColor,
    getStatusIcon,
  };
}
