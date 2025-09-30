import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getEmissionSourcesWithEmissions, 
  getEmissionStats, 
  deleteEmissionSource 
} from '@/services/emissions';
import { errorHandler } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export function useInventoryData() {
  const { toast } = useToast();
  const [emissionSources, setEmissionSources] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sourcesData, statsData] = await Promise.all([
        getEmissionSourcesWithEmissions(),
        getEmissionStats()
      ]);
      setEmissionSources(sourcesData);
      setStats(statsData);
    } catch (error) {
      logger.error('Erro ao carregar dados do inventário', error as Error, {
        component: 'useInventoryData',
        action: 'loadData'
      });
      errorHandler.showUserError(error, {
        component: 'useInventoryData',
        function: 'loadData'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSource = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fonte de emissão?')) {
      return false;
    }

    try {
      await deleteEmissionSource(id);
      await loadData();
      toast({
        title: "Sucesso",
        description: "Fonte de emissão excluída com sucesso!",
      });
      return true;
    } catch (error) {
      logger.error('Erro ao excluir fonte de emissão', error as Error, {
        component: 'useInventoryData',
        action: 'deleteSource',
        metadata: { sourceId: id }
      });
      errorHandler.showUserError(error, {
        component: 'useInventoryData',
        function: 'deleteSource'
      });
      return false;
    }
  }, [loadData, toast]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteEmissionSource(id)));
      await loadData();
      toast({
        title: "Sucesso",
        description: `${ids.length} fonte(s) excluída(s) com sucesso!`,
      });
      setSelectedSources([]);
      return true;
    } catch (error) {
      logger.error('Erro ao excluir fontes em lote', error as Error, {
        component: 'useInventoryData',
        action: 'bulkDelete',
        metadata: { count: ids.length }
      });
      errorHandler.showUserError(error, {
        component: 'useInventoryData',
        function: 'bulkDelete'
      });
      return false;
    }
  }, [loadData, toast]);

  const toggleSourceSelection = useCallback((id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllSources = useCallback((sources: any[]) => {
    setSelectedSources(sources.map(s => s.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSources([]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    emissionSources,
    stats,
    isLoading,
    selectedSources,
    loadData,
    deleteSource,
    bulkDelete,
    toggleSourceSelection,
    selectAllSources,
    clearSelection,
  };
}
