import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, BarChart3, Target, Network } from 'lucide-react';
import ProcessMapEditor from '@/components/ProcessMapEditor';
import { useProcessMapping } from '@/hooks/data/useProcessMapping';
import { ProcessMappingHeader } from '@/components/process/ProcessMappingHeader';
import { ProcessStatsCards } from '@/components/process/ProcessStatsCards';
import { ProcessMapsList } from '@/components/process/ProcessMapsList';
import { ProcessAnalyticsTab } from '@/components/process/ProcessAnalyticsTab';
import { ProcessMethodologyTab } from '@/components/process/ProcessMethodologyTab';
import { ProcessIntegrationTab } from '@/components/process/ProcessIntegrationTab';

const MapeamentoProcessos = () => {
  const {
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
  } = useProcessMapping();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Se um processo está selecionado para edição, mostra o editor
  if (selectedProcessId) {
    return (
      <div className="container mx-auto p-6">
        <ProcessMapEditor 
          processMapId={selectedProcessId} 
          onClose={() => setSelectedProcessId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ProcessMappingHeader
        isCreateProcessOpen={isCreateProcessOpen}
        onOpenChange={setIsCreateProcessOpen}
        newProcessData={newProcessData}
        onDataChange={setNewProcessData}
        onCreateProcess={handleCreateProcess}
        isCreating={createProcessMutation.isPending}
      />

      <ProcessStatsCards processMaps={processMaps} />

      <Tabs defaultValue="processes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="processes" className="gap-2">
            <Map className="h-4 w-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="methodology" className="gap-2">
            <Target className="h-4 w-4" />
            Metodologia
          </TabsTrigger>
          <TabsTrigger value="integration" className="gap-2">
            <Network className="h-4 w-4" />
            Integração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4 mt-6">
          <ProcessMapsList
            processMaps={processMaps}
            onSelectProcess={setSelectedProcessId}
            onCreateProcess={() => setIsCreateProcessOpen(true)}
            getProcessTypeColor={getProcessTypeColor}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <ProcessAnalyticsTab processMaps={processMaps} />
        </TabsContent>

        <TabsContent value="methodology" className="space-y-4 mt-6">
          <ProcessMethodologyTab />
        </TabsContent>

        <TabsContent value="integration" className="space-y-4 mt-6">
          <ProcessIntegrationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MapeamentoProcessos;
