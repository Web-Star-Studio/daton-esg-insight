import React, { useState, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { DataCard } from "@/components/DataCard";
import { FilterBar } from "@/components/FilterBar";
import { StatsOverview } from "@/components/StatsOverview";
import { JSONPreviewModal } from "@/components/JSONPreviewModal";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download,
  RefreshCw,
  Grid3x3,
  List,
  Eye,
  Edit,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useAllDatabaseData, DatabaseSection } from "@/hooks/useAllDatabaseData";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportAllToExcel, exportSectionToExcel, SECTION_ROUTES } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DatabaseSettings {
  viewMode: 'grid' | 'table';
  exportFormat: 'xlsx' | 'csv' | 'json';
  visibleSections: string[];
  flattenObjects: boolean;
  includeMetadata: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

const BancoDados = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ data: any; title: string; sectionTitle: string } | null>(null);
  const [settings, setSettings] = useState<DatabaseSettings>({
    viewMode: 'grid',
    exportFormat: 'xlsx',
    visibleSections: [],
    flattenObjects: true,
    includeMetadata: true,
    autoRefresh: false,
    refreshInterval: 30
  });
  
  // Fetch all database data
  const { sections, isLoading, totalRecords } = useAllDatabaseData();
  
  // Initialize visible sections when sections are loaded
  React.useEffect(() => {
    if (sections.length > 0 && settings.visibleSections.length === 0) {
      setSettings(prev => ({
        ...prev,
        visibleSections: sections.map(s => s.id)
      }));
    }
  }, [sections, settings.visibleSections.length]);
  
  // Filter sections by visibility settings
  const visibleSections = sections.filter(section => 
    settings.visibleSections.includes(section.id)
  );
  
  // Global search and filtering
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    clearAll,
    results: filteredSections,
    stats
  } = useGlobalSearch(visibleSections);

  const activeSections = visibleSections.filter(section => section.status === 'active').length;

  const handleExportAll = async () => {
    try {
      const sectionsWithData = filteredSections.filter(s => s.data && s.data.length > 0);
      if (sectionsWithData.length === 0) {
        toast.warning('Nenhuma seção com dados encontrada para exportar');
        return;
      }
      
      const sheetsAdded = exportAllToExcel(sectionsWithData, {
        format: 'xlsx',
        flattenObjects: settings.flattenObjects,
        includeMetadata: settings.includeMetadata
      });
      
      toast.success(`Exportação concluída com ${sheetsAdded} planilhas`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro na exportação');
    }
  };

  const handleSectionView = useCallback((section: DatabaseSection) => {
    setSelectedSection(section.id);
    if (settings.viewMode === 'grid') {
      setSettings(prev => ({ ...prev, viewMode: 'table' }));
    }
  }, [settings.viewMode]);

  const handleSectionEdit = useCallback((section: DatabaseSection) => {
    const route = SECTION_ROUTES[section.id];
    if (route) {
      navigate(route);
      toast.success(`Navegando para ${section.title}`);
    } else {
      toast.info(`Edição não disponível para ${section.title}`);
    }
  }, [navigate]);

  const handleSectionExport = useCallback((section: DatabaseSection) => {
    try {
      exportSectionToExcel(section, {
        format: settings.exportFormat,
        flattenObjects: settings.flattenObjects,
        includeMetadata: settings.includeMetadata
      });
      toast.success(`${section.title} exportado com sucesso`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro na exportação');
    }
  }, [settings]);

  const handleSectionNew = useCallback((section: DatabaseSection) => {
    const route = SECTION_ROUTES[section.id];
    if (route) {
      navigate(route);
      toast.success(`Criando novo item em ${section.title}`);
    } else {
      toast.info(`Criação não disponível para ${section.title}`);
    }
  }, [navigate]);

  const handleItemView = (item: any, sectionTitle: string) => {
    const title = item.name || item.title || item.file_name || `Item ${sectionTitle}`;
    setPreviewData({ data: item, title, sectionTitle });
  };

  const handleItemEdit = (item: any, section: DatabaseSection) => {
    const route = SECTION_ROUTES[section.id];
    if (route && item.id) {
      navigate(`${route}/${item.id}/edit`);
    } else {
      navigate(route || '/');
    }
  };

  const handleItemExternal = (item: any, section: DatabaseSection) => {
    const route = SECTION_ROUTES[section.id];
    if (route) {
      navigate(route);
    }
  };

  const DataTable = ({ section }: { section: DatabaseSection }) => {
    const dataArray = Array.isArray(section.data) ? section.data : section.data ? [section.data] : [];
    const displayData = dataArray.slice(0, 10); // Show first 10 items
    
    if (section.status === 'error') {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg font-medium mb-2">Erro ao carregar dados</p>
              <p className="text-sm mb-4">Não foi possível carregar {section.title}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (dataArray.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
              <p className="text-sm mb-4">{section.title} ainda não possui dados</p>
              <Button onClick={() => handleSectionNew(section)}>
                <span className="mr-2">+</span>
                Adicionar {section.title}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{dataArray.length} registro(s) encontrado(s)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSectionExport(section)}
                disabled={dataArray.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.name || item.title || item.file_name || `Item ${index + 1}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.description || item.category || item.type || 'Sem descrição'}
                  </TableCell>
                  <TableCell>
                    {item.status && (
                      <Badge variant={
                        item.status === 'Ativo' || item.status === 'Concluída' ? 'default' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleItemView(item, section.title)}
                        title="Visualizar detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleItemEdit(item, section)}
                        title="Editar registro"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleItemExternal(item, section)}
                        title="Ir para módulo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dataArray.length > 10 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline"
                onClick={() => handleSectionView(section)}
              >
                Ver todos os {dataArray.length} registros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banco de Dados</h1>
            <p className="text-muted-foreground">
              Central completa de dados - visualize, gerencie e exporte todas as informações da sua empresa
            </p>
            {isLoading && (
              <p className="text-sm text-blue-600 mt-1">
                Carregando dados do banco de dados...
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button 
                variant={settings.viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSettings(prev => ({ ...prev, viewMode: 'grid' }))}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={settings.viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setSettings(prev => ({ ...prev, viewMode: 'table' }))}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Dados
            </Button>
            <SettingsDrawer 
              sections={sections}
              settings={settings}
              onSettingsChange={setSettings}
            />
            <Button onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview 
          totalRecords={totalRecords}
          totalSections={visibleSections.length}
          activeSections={activeSections}
          isLoading={isLoading}
        />

        {/* Advanced Filter Bar */}
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilters={activeFilters}
          addFilter={addFilter}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
          clearAll={clearAll}
          stats={stats}
        />

        {/* Main Content */}
        {settings.viewMode === 'grid' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSections.map((section) => (
                <DataCard
                  key={section.id}
                  section={section}
                  onClick={() => handleSectionView(section)}
                  onView={() => handleSectionView(section)}
                  onEdit={() => handleSectionEdit(section)}
                  onExport={() => handleSectionExport(section)}
                  onNew={() => handleSectionNew(section)}
                  isSelected={selectedSection === section.id}
                  exportFormat={settings.exportFormat}
                />
              ))}
            </div>
            
            {/* Detailed view for selected section */}
            {selectedSection && (
              <div className="mt-8">
                <DataTable 
                  section={filteredSections.find(s => s.id === selectedSection)!} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map((section) => (
              <DataTable key={section.id} section={section} />
            ))}
          </div>
        )}

        {/* JSON Preview Modal */}
        {previewData && (
          <JSONPreviewModal
            isOpen={!!previewData}
            onClose={() => setPreviewData(null)}
            data={previewData.data}
            title={previewData.title}
            sectionTitle={previewData.sectionTitle}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default BancoDados;