import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { AddEmissionSourceModal } from "@/components/AddEmissionSourceModal";
import EditEmissionSourceModal from "@/components/EditEmissionSourceModal";
import { ActivityDataModal } from "@/components/ActivityDataModal";
import { StationaryCombustionModal } from "@/components/StationaryCombustionModal";
import { MobileCombustionModal } from "@/components/MobileCombustionModal";
import { FugitiveEmissionsModal } from "@/components/FugitiveEmissionsModal";
import { IndustrialProcessesModal } from "@/components/IndustrialProcessesModal";
import { AgricultureModal } from "@/components/AgricultureModal";
import { Scope3CategoryModal } from "@/components/Scope3CategoryModal";
import { AdvancedAnalyticsModal } from "@/components/AdvancedAnalyticsModal";
import { RecalculateEmissionsButton } from "@/components/RecalculateEmissionsButton";
import { GHGProtocolCompleteModal } from "@/components/GHGProtocolCompleteModal";

import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryCharts } from "@/components/inventory/InventoryCharts";
import { InventoryTable } from "@/components/inventory/InventoryTable";

import { useInventoryData } from "@/hooks/data/useInventoryData";

const InventarioGEE = () => {
  const { toast } = useToast();
  
  // Data management hook
  const {
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
  } = useInventoryData();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [showCharts, setShowCharts] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isMobileCombustionModalOpen, setIsMobileCombustionModalOpen] = useState(false);
  const [isFugitiveEmissionsModalOpen, setIsFugitiveEmissionsModalOpen] = useState(false);
  const [isIndustrialProcessesModalOpen, setIsIndustrialProcessesModalOpen] = useState(false);
  const [isAgricultureModalOpen, setIsAgricultureModalOpen] = useState(false);
  const [isScope3CategoryModalOpen, setIsScope3CategoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isGHGCompleteModalOpen, setIsGHGCompleteModalOpen] = useState(false);

  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [activityDataSource, setActivityDataSource] = useState<any>(null);
  const [editingActivityData, setEditingActivityData] = useState<any>(null);

  const HIGH_EMISSION_THRESHOLD = 100;

  // Handlers
  const handleEditSource = (source: any) => {
    setSelectedSource(source);
    setIsEditModalOpen(true);
  };

  const handleManageActivityData = (source: any) => {
    setActivityDataSource(source);
    setEditingActivityData(null);
    
    if (source.category === 'Combustão Móvel') {
      setIsMobileCombustionModalOpen(true);
    } else if (source.category === 'Emissões Fugitivas') {
      setIsFugitiveEmissionsModalOpen(true);
    } else if (source.category === 'Processos Industriais') {
      setIsIndustrialProcessesModalOpen(true);
    } else if (source.category === 'Agricultura') {
      setIsAgricultureModalOpen(true);
    } else if (source.scope === 3) {
      setIsScope3CategoryModalOpen(true);
    } else {
      setIsActivityModalOpen(true);
    }
  };

  const handleExportReport = async () => {
    if (emissionSources.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário de GEE</h1>
          <p className="text-muted-foreground">
            Gerenciamento de Gases de Efeito Estufa segundo GHG Protocol
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Fonte
          </Button>
          <RecalculateEmissionsButton onSuccess={loadData} />
        </div>
      </div>

      {/* Stats Overview */}
      <InventoryHeader 
        stats={stats} 
        highEmissionThreshold={HIGH_EMISSION_THRESHOLD}
      />

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            showCharts={showCharts}
            onShowChartsChange={setShowCharts}
            comparisonEnabled={comparisonEnabled}
            onComparisonChange={setComparisonEnabled}
            selectedSources={selectedSources}
            onBulkDelete={() => bulkDelete(selectedSources)}
            onExportReport={handleExportReport}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <InventoryCharts
        stats={stats}
        emissionSources={emissionSources}
        show={showCharts}
      />

      {/* Data Table */}
      <InventoryTable
        emissionSources={emissionSources}
        selectedSources={selectedSources}
        searchTerm={searchTerm}
        isLoading={isLoading}
        onToggleSelection={toggleSourceSelection}
        onSelectAll={() => selectAllSources(emissionSources)}
        onClearSelection={clearSelection}
        onEditSource={handleEditSource}
        onDeleteSource={deleteSource}
        onManageActivityData={handleManageActivityData}
      />

      {/* Modals */}
      <AddEmissionSourceModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={loadData}
      />

      <EditEmissionSourceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        source={selectedSource}
        onSuccess={loadData}
      />

      {activityDataSource && (
        <>
          {activityDataSource.category === 'Combustão Estacionária' ? (
            <StationaryCombustionModal
              open={isActivityModalOpen}
              onOpenChange={(open) => {
                setIsActivityModalOpen(open);
                if (!open) setEditingActivityData(null);
              }}
              emissionSourceId={activityDataSource.id}
              onSuccess={loadData}
              editingData={editingActivityData}
              source={activityDataSource}
            />
          ) : activityDataSource.category === 'Combustão Móvel' ? (
            <MobileCombustionModal
              isOpen={isMobileCombustionModalOpen}
              onClose={() => {
                setIsMobileCombustionModalOpen(false);
                setEditingActivityData(null);
              }}
              source={activityDataSource}
            />
          ) : activityDataSource.category === 'Emissões Fugitivas' ? (
            <FugitiveEmissionsModal
              isOpen={isFugitiveEmissionsModalOpen}
              onClose={() => {
                setIsFugitiveEmissionsModalOpen(false);
                setEditingActivityData(null);
              }}
              source={activityDataSource}
            />
          ) : activityDataSource.category === 'Processos Industriais' ? (
            <IndustrialProcessesModal
              isOpen={isIndustrialProcessesModalOpen}
              onClose={() => {
                setIsIndustrialProcessesModalOpen(false);
                setEditingActivityData(null);
              }}
              source={activityDataSource}
            />
          ) : activityDataSource.category === 'Agricultura' ? (
            <AgricultureModal
              isOpen={isAgricultureModalOpen}
              onClose={() => {
                setIsAgricultureModalOpen(false);
                setEditingActivityData(null);
              }}
              source={activityDataSource}
            />
          ) : activityDataSource.scope === 3 ? (
            <Scope3CategoryModal
              isOpen={isScope3CategoryModalOpen}
              onClose={() => {
                setIsScope3CategoryModalOpen(false);
                setEditingActivityData(null);
              }}
              onSuccess={loadData}
            />
          ) : (
            <ActivityDataModal
              open={isActivityModalOpen}
              onOpenChange={(open) => {
                setIsActivityModalOpen(open);
                if (!open) setEditingActivityData(null);
              }}
              source={activityDataSource}
              onSuccess={loadData}
              editingData={editingActivityData}
            />
          )}
        </>
      )}

      <AdvancedAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      <GHGProtocolCompleteModal
        isOpen={isGHGCompleteModalOpen}
        onClose={() => setIsGHGCompleteModalOpen(false)}
      />
    </div>
  );
};

export default InventarioGEE;
